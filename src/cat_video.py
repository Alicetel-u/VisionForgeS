import os
import json
import sys
import requests
import wave
import contextlib
from dotenv import load_dotenv

# 標準出力をUTF-8に強制設定（Windows環境の文字化け対策）
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env ファイルから環境変数を読み込む
load_dotenv()

def log(msg):
    print(msg, flush=True)

def get_audio_duration(file_path):
    """wavファイルの長さを秒単位で取得します。"""
    try:
        if not os.path.exists(file_path): return 5.0
        with contextlib.closing(wave.open(file_path,'r')) as f:
            frames = f.getnframes()
            rate = f.getframerate()
            duration = frames / float(rate)
            return duration
    except Exception as e:
        log(f"  [ERROR] duration取得エラー: {e}")
        return 5.0

VOICEVOX_URL = "http://127.0.0.1:50021"

def generate_voice(text, output_path, speaker_id=10):
    """VOICEVOX APIを使用して音声を生成します。"""
    try:
        query_payload = {"text": text, "speaker": speaker_id}
        query_response = requests.post(f"{VOICEVOX_URL}/audio_query", params=query_payload, timeout=20)
        if query_response.status_code != 200: 
            return False
            
        query_data = query_response.json()
        query_data["speedScale"] = 1.15  # 少しゆっくりめ

        synthesis_response = requests.post(
            f"{VOICEVOX_URL}/synthesis",
            params={"speaker": speaker_id},
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
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key: 
        log("  [WARNING] Pexels APIキーが設定されていません")
        return False
    try:
        url = "https://api.pexels.com/v1/search"
        headers = {"Authorization": api_key}
        params = {"query": query, "per_page": 1, "orientation": "landscape"}
        response = requests.get(url, headers=headers, params=params, timeout=15)
        if response.status_code == 200:
            data = response.json()
            if data["photos"]:
                img_url = data["photos"][0]["src"]["large"]
                img_data = requests.get(img_url).content
                with open(output_path, "wb") as f:
                    f.write(img_data)
                log(f"  [OK] 画像保存: {os.path.basename(output_path)} (クエリ: {query})")
                return True
    except Exception as e:
        log(f"  [ERROR] 画像取得エラー: {e}")
    return False

def create_cat_video_data():
    """ネコの種類と生態紹介動画データを生成します。"""
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    VIDEO_PUBLIC_DIR = os.path.join(BASE_DIR, "video", "public")
    
    for sub in ["audio", "images"]:
        path = os.path.join(VIDEO_PUBLIC_DIR, sub)
        if not os.path.exists(path): 
            os.makedirs(path)
            log(f"[OK] ディレクトリ作成: {path}")

    log("=" * 60)
    log("🐱 ネコの種類と生態紹介動画の生成を開始します")
    log("=" * 60)

    # 画像クエリと保存先のマッピング
    image_queries = [
        ("scottish fold cat cute", "images/cat_scottish.jpg"),
        ("munchkin cat short legs", "images/cat_munchkin.jpg"),
        ("ragdoll cat fluffy", "images/cat_ragdoll.jpg"),
        ("british shorthair cat", "images/cat_british.jpg"),
        ("cat playing", "images/cat_playing.jpg"),
        ("cat grooming", "images/cat_grooming.jpg"),
    ]

    # 画像をダウンロード
    log("\n📸 画像のダウンロード中...")
    for query, img_rel in image_queries:
        img_full = os.path.join(VIDEO_PUBLIC_DIR, img_rel)
        download_image_pexels(query, img_full)

    # 原稿定義（カノンとずんだもんの掛け合い）
    # (speaker, emotion, image, text)
    raw_script = [
        ("kanon", "happy", None, "みなさん、こんにちは！ペットナビゲーターのカノンです！"),
        ("zundamon", "happy", None, "ずんだもんなのだ！今日は何を紹介するのだ？"),
        ("kanon", "happy", None, "今日は、大人気のネコちゃんたちを紹介しますよ！"),
        ("zundamon", "surprised", None, "ネコなのだ！ずんだもん、ネコ大好きなのだ！"),
        
        # スコティッシュフォールド
        ("kanon", "happy", "images/cat_scottish.jpg", "まずは、スコティッシュフォールド！前方に折れた耳が特徴的で、丸い顔がとっても愛らしいんです。"),
        ("zundamon", "happy", "images/cat_scottish.jpg", "わあ！耳が折れてて可愛いのだ！"),
        ("kanon", "normal", "images/cat_scottish.jpg", "性格は穏やかで愛情深く、人懐っこいんですよ。甘えん坊で、犬のようだと言われることもあります。"),
        ("zundamon", "happy", None, "いいのだ！一緒に遊びたいのだ！"),
        
        # マンチカン
        ("kanon", "surprised", "images/cat_munchkin.jpg", "次はマンチカン！短い足が特徴的で、とってもキュートなんです。"),
        ("zundamon", "surprised", "images/cat_munchkin.jpg", "足が短いのだ！でもちゃんと走れるのだ？"),
        ("kanon", "happy", "images/cat_munchkin.jpg", "はい！短い足でも元気に走り回りますよ。好奇心旺盛で遊び好きな性格なんです。"),
        ("zundamon", "happy", None, "元気なネコさんなのだ！"),
        
        # ラグドール
        ("kanon", "happy", "images/cat_ragdoll.jpg", "そしてラグドール。ふさふさの白く長い被毛とブルーの瞳が美しいんです。"),
        ("zundamon", "happy", "images/cat_ragdoll.jpg", "わあ！ふわふわで綺麗なのだ！"),
        ("kanon", "normal", "images/cat_ragdoll.jpg", "名前は「ぬいぐるみ」という意味で、抱っこされると体を預けてリラックスするんですよ。性格も温厚で穏やかです。"),
        ("zundamon", "happy", None, "抱っこしたいのだ！"),
        
        # ブリティッシュショートヘア
        ("kanon", "normal", "images/cat_british.jpg", "最後はブリティッシュショートヘア。丸い顔と大きな目、ずんぐりむっくりした体型が特徴です。"),
        ("zundamon", "happy", "images/cat_british.jpg", "まんまるで可愛いのだ！"),
        ("kanon", "normal", "images/cat_british.jpg", "成長すると自立心が強くなって、一人で過ごすのも得意なんです。留守番も安心ですね。"),
        
        # 飼育のポイント
        ("zundamon", "normal", None, "ネコを飼うときに気を付けることはあるのだ？"),
        ("kanon", "normal", "images/cat_grooming.jpg", "長毛種の場合は、毎日のブラッシングが大切です。それと、太りやすい品種もいるので、体重管理も重要ですよ。"),
        ("zundamon", "normal", "images/cat_playing.jpg", "遊びの時間も必要なのだ？"),
        ("kanon", "happy", "images/cat_playing.jpg", "もちろん！特に好奇心旺盛な子は、たくさん遊んであげると喜びますよ。"),
        
        # エンディング
        ("zundamon", "happy", None, "カノン、ずんだもんもネコちゃん飼いたくなったのだ！"),
        ("kanon", "happy", None, "どの品種も魅力的でしたね！みなさんも、自分に合ったネコちゃんを見つけてくださいね！"),
        ("zundamon", "happy", None, "よし、ずんだもんも今日からネコになるのだ！語尾は『にゃ』にするのだにゃ！"),
        ("kanon", "happy", None, "あはは、ずんだもんさんはそのままで十分可愛いですよ。皆さんは何色のネコちゃんが好きですか？ぜひコメント欄で教えてくださいね！"),
        ("zundamon", "happy", None, "またね、なのだ！"),
        ("kanon", "happy", None, "それでは、また次回お会いしましょう！バイバイ！"),
    ]

    video_script = []
    # 話者とSpeaker IDのマッピング
    SPEAKER_IDS = {
        "kanon": 10,      # 雨晴はう (ノーマル)
        "zundamon": 3     # ずんだもん (ノーマル)
    }
    scene_id = 0

    log("\n🎤 音声生成中...")
    for speaker, emotion, image, text in raw_script:
        log(f"  Scene {scene_id} ({speaker}): {text[:30]}...")
        audio_rel = f"audio/cat_scene_{scene_id}.wav"
        audio_full = os.path.join(VIDEO_PUBLIC_DIR, audio_rel)
        
        # 話者に応じた声で生成
        speaker_id = SPEAKER_IDS.get(speaker, 10)
        if generate_voice(text, audio_full, speaker_id=speaker_id):
            video_script.append({
                "id": scene_id,
                "speaker": speaker,
                "emotion": emotion,
                "text": text,
                "audio": audio_rel,
                "image": image if image else "images/bg_thread.jpg",
                "duration": get_audio_duration(audio_full) + 0.5
            })
            log(f"    ✓ 音声生成完了 (長さ: {get_audio_duration(audio_full):.2f}秒 + 0.5s padding)")
            scene_id += 1
        else:
            log(f"    ✗ 音声生成失敗")

    json_path = os.path.join(VIDEO_PUBLIC_DIR, "cat_data.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(video_script, f, ensure_ascii=False, indent=2)
    
    log("\n" + "=" * 60)
    log(f"✅ ネコ紹介動画データの生成が完了しました！")
    log(f"📁 保存先: {json_path}")
    log(f"🎬 総シーン数: {len(video_script)}")
    total_duration = sum(scene["duration"] for scene in video_script)
    log(f"⏱️  総再生時間: {total_duration:.2f}秒 ({total_duration/60:.1f}分)")
    log("=" * 60)

if __name__ == "__main__":
    create_cat_video_data()
