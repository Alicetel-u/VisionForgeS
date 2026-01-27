import os
import json
import sys
import requests
import re
import wave
import contextlib
from dotenv import load_dotenv

# 標準出力をUTF-8に強制設定（Windows環境の文字化け対策）
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 環境変数を読み込む
load_dotenv()

def log(message):
    print(message, flush=True)

def get_audio_duration(file_path):
    """WAVファイルの再生時間を取得します(秒)。"""
    try:
        with contextlib.closing(wave.open(file_path, 'r')) as f:
            frames = f.getnframes()
            rate = f.getframerate()
            duration = frames / float(rate)
            return duration
    except Exception as e:
        log(f"  [ERROR] 音声時間の取得に失敗しました: {e}")
        return 0

# VOICEVOXの設定
VOICEVOX_URL = "http://127.0.0.1:50021"
SPEAKERS = {
    "metan": 2,      # 四国めたん
    "zundamon": 3    # ずんだもん
}

def generate_voice(text, speaker_id, output_path):
    """VOICEVOX APIを使用して音声を生成します。"""
    log(f"  [音声] 生成中 ({speaker_id}): {os.path.basename(output_path)}")
    
    # 読み間違い・記号の修正
    text = text.replace("!!", "").replace("！！", "").replace("ｗｗｗ", "わらわらわら")
    text = re.sub(r'「(.*?)」', r'\1', text) # 読み上げでは「」を外す

    try:
        query_payload = {"text": text, "speaker": speaker_id}
        query_response = requests.post(f"{VOICEVOX_URL}/audio_query", params=query_payload, timeout=20)
        if query_response.status_code != 200: return False
            
        query_data = query_response.json()
        query_data["speedScale"] = 1.25
        synthesis_payload = {"speaker": speaker_id}
        synthesis_response = requests.post(
            f"{VOICEVOX_URL}/synthesis",
            params=synthesis_payload,
            json=query_data,
            timeout=60
        )

        if synthesis_response.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(synthesis_response.content)
            return True
    except Exception as e:
        log(f"  [ERROR] 音声生成エラー: {e}")
    return False

def download_image_pexels(query, output_path):
    """Pexels APIを使用して画像をダウンロードします。"""
    log(f"  [検索] 画像を検索中: {query}")
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key: return False
    
    try:
        url = "https://api.pexels.com/v1/search"
        headers = {"Authorization": api_key}
        params = {"query": query, "per_page": 1, "orientation": "landscape"}
        response = requests.get(url, headers=headers, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("photos") and len(data["photos"]) > 0:
                image_url = data["photos"][0]["src"]["large2x"]
                img_response = requests.get(image_url, timeout=20)
                if img_response.status_code == 200:
                    with open(output_path, "wb") as f:
                        f.write(img_response.content)
                    log(f"  [OK] 画像を保存: {os.path.basename(output_path)}")
                    return True
    except Exception as e:
        log(f"  [ERROR] 画像取得エラー: {e}")
    return False

def create_thread_video_data():
    """スレ紹介形式の動画データを生成します。"""
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    VIDEO_PUBLIC_DIR = os.path.join(BASE_DIR, "video", "public")
    
    # 台本データ（手動定義版 - 将来的にはAIが生成する想定）
    script = [
        {"speaker": "zundamon", "text": "えぇっ！？モンハン遊ぶためにNASAのパソコンを持ってこいってことかよー！？", "type": "narration", "emotion": "surprised"},
        {"speaker": "metan", "text": "落ち着きなさい、ずんだもん。カプコンから最新作ワイルズの要求スペックが公開されたんだけど…。", "type": "narration", "emotion": "normal"},
        {"speaker": "metan", "text": "これが想像以上に『モンスター』級なのよ。", "type": "narration", "emotion": "sad"},
        {"speaker": "zundamon", "text": "波紋どころか爆発なのだ！推奨でフレーム生成必須って、最適化を諦めてるだろ！", "type": "narration", "emotion": "angry"},
        {"speaker": "zundamon", "text": "RTX2060で60fps出すのにフレーム生成必須なんて、ずんだもんは認めないのだ！", "type": "narration", "emotion": "angry"},
        
        {"speaker": "metan", "text": "スレ民の反応も凄いわよ。例えばこれ。", "type": "narration", "emotion": "normal"},
        {"speaker": "zundamon", "text": "「推奨でフレーム生成必須とか、もはやゲーム機じゃなくて暖房器具だろ」…火事確定なのだｗｗ", "type": "comment", "comment_text": "推奨でフレーム生成必須とか終わってるだろ。最適化不足をスペックで誤魔化すな", "emotion": "happy"},
        
        {"speaker": "metan", "text": "一方で「次世代のグラフィックなら当然」って富裕層もいるみたいね。羨ましいわ…。", "type": "comment", "comment_text": "次世代のグラフィックならこれくらい当然。4090持ってるから最高画質で遊び尽くすわ", "emotion": "sad"},
        
        {"speaker": "zundamon", "text": "みんなはこのNASA級スペック、どう思うのだ？コメント欄で教えてほしいのだ！", "type": "narration", "emotion": "normal"},
        {"speaker": "metan", "text": "高評価とチャンネル登録も、よろしく頼むわね。", "type": "narration", "emotion": "happy"},
        {"speaker": "zundamon", "text": "バイバイなのだー！", "type": "narration", "emotion": "happy"},
    ]

    # 背景画像の検索キーワード
    bg_query = "Monster Hunter Wilds Gaming PC"
    bg_image_rel = "images/bg_thread.jpg"
    bg_image_full = os.path.join(VIDEO_PUBLIC_DIR, bg_image_rel)
    download_image_pexels(bg_query, bg_image_full)

    final_data = []
    for i, line in enumerate(script):
        log(f"\n--- シーン {i+1}/{len(script)} ---")
        audio_rel = f"audio/thread_voice_{i}.wav"
        audio_full = os.path.join(VIDEO_PUBLIC_DIR, audio_rel)
        
        speaker_id = SPEAKERS[line["speaker"]]
        success = generate_voice(line["text"], speaker_id, audio_full)
        
        if success:
            line["id"] = i
            line["audio"] = audio_rel
            line["bg_image"] = bg_image_rel
            line["duration"] = get_audio_duration(audio_full)
            final_data.append(line)

    # 保存
    json_path = os.path.join(VIDEO_PUBLIC_DIR, "news_data.json") # 互換性のために同じ名前に上書き
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    log(f"\n[完了] スレ紹介動画用の素材を生成しました。")

if __name__ == "__main__":
    create_thread_video_data()
