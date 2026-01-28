import os
import json
import requests
import wave
import contextlib
import sys
import re

# 標準出力をUTF-8に強制設定（Windows環境の文字化け対策）
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

VOICEVOX_URL = "http://127.0.0.1:50021"

def log(msg):
    print(msg, flush=True)

def get_audio_duration(file_path):
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

def generate_voice(text, output_path, speaker_id):
    try:
        # 簡易的な読み調整
        text = text.replace("コメント欄", "コメントらん").replace("高評価", "こうひょうか")
        
        query_payload = {"text": text, "speaker": speaker_id}
        query_response = requests.post(f"{VOICEVOX_URL}/audio_query", params=query_payload, timeout=20)
        if query_response.status_code != 200: return False
            
        query_data = query_response.json()
        query_data["speedScale"] = 1.2

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

def create_ending_data():
    BASE_DIR = r"c:\Users\【RST-9】リバイブ新所沢\Desktop\Antigravity_Projects\VisionForge"
    VIDEO_PUBLIC_DIR = os.path.join(BASE_DIR, "video", "public")
    CAT_DATA_PATH = os.path.join(VIDEO_PUBLIC_DIR, "cat_data.json")

    # 話者ID
    ZUNDAMON_ID = 3
    KANON_ID = 10 # 雨晴はう

    script = [
        {"speaker": "zundamon", "speaker_id": ZUNDAMON_ID, "emotion": "panic", "text": "ふぅ…今回も濃いニュースだったのだ。ボク、もうお腹いっぱいなのだ。", "id_suffix": "end_0"},
        {"speaker": "kanon", "speaker_id": KANON_ID, "emotion": "happy", "text": "何言ってるの、まだ始まったばかりよ。次も面白いネタを探してこなきゃね。", "id_suffix": "end_1"},
        {"speaker": "zundamon", "speaker_id": ZUNDAMON_ID, "emotion": "happy", "text": "そうなのだ！というわけで、みんなの感想もコメント欄で待ってるのだ！", "id_suffix": "end_2"},
        {"speaker": "kanon", "speaker_id": KANON_ID, "emotion": "happy", "text": "チャンネル登録と高評価も、忘れないでちょうだいね。それじゃあ、またね！", "id_suffix": "end_3"},
    ]

    # 既存データの読み込み
    with open(CAT_DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    last_id = data[-1]["id"] if data else 0
    bg_image = "images/bg_kanon_room.png"

    for i, item in enumerate(script):
        log(f"エンディング音声生成中 ({item['speaker']}): {item['text'][:15]}...")
        audio_rel = f"audio/ending_{i}.wav"
        audio_full = os.path.join(VIDEO_PUBLIC_DIR, audio_rel)
        
        if generate_voice(item["text"], audio_full, item["speaker_id"]):
            data.append({
                "id": last_id + i + 1,
                "speaker": item["speaker"],
                "emotion": item["emotion"],
                "text": item["text"],
                "audio": audio_rel,
                "bg_image": bg_image,
                "duration": get_audio_duration(audio_full)
            })

    with open(CAT_DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    log("\n[完了] エンディング茶番データを追加しました。")

if __name__ == "__main__":
    create_ending_data()
