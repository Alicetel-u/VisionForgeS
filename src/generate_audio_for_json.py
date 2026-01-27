import os
import json
import requests
import wave
import contextlib
import sys

# 標準出力をUTF-8に設定
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

VOICEVOX_URL = "http://127.0.0.1:50021"
SPEAKER_IDS = {
    "kanon": 10,      # 雨晴はう (ノーマル)
    "zundamon": 3     # ずんだもん (ノーマル)
}

def log(msg):
    print(msg, flush=True)

def get_audio_duration(file_path):
    try:
        if not os.path.exists(file_path): return 5.0
        with contextlib.closing(wave.open(file_path,'r')) as f:
            frames = f.getnframes()
            rate = f.getframerate()
            return frames / float(rate)
    except:
        return 5.0

def generate_voice(text, output_path, speaker_id):
    try:
        query_payload = {"text": text, "speaker": speaker_id}
        query_response = requests.post(f"{VOICEVOX_URL}/audio_query", params=query_payload, timeout=20)
        if query_response.status_code != 200: return False
        
        query_data = query_response.json()
        query_data["speedScale"] = 1.1  # 少し速めに

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
        log(f"  [ERROR] {e}")
    return False

def main():
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    JSON_PATH = os.path.join(BASE_DIR, "video", "public", "cat_data.json")
    AUDIO_DIR = os.path.join(BASE_DIR, "video", "public", "audio")
    
    if not os.path.exists(AUDIO_DIR):
        os.makedirs(AUDIO_DIR)

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    log(f"--- 音声生成開始: {len(data)} シーン ---")
    
    updated_data = []
    for item in data:
        speaker = item.get("speaker", "kanon")
        text = item.get("text", "")
        audio_file = item.get("audio", f"t{item['id']}.wav")
        
        # 保存パスの正規化（audio/t1.wav のような形式に対応）
        if audio_file.startswith("audio/"):
            audio_full_path = os.path.join(BASE_DIR, "video", "public", audio_file)
        else:
            audio_full_path = os.path.join(AUDIO_DIR, audio_file)
            item["audio"] = f"audio/{audio_file}"

        speaker_id = SPEAKER_IDS.get(speaker, 10)
        
        log(f"Generating [{speaker}]: {text[:20]}...")
        if generate_voice(text, audio_full_path, speaker_id):
            duration = get_audio_duration(audio_full_path)
            item["duration"] = round(duration + 0.6, 2)
            log(f"  ✓ Success ({duration:.2f}s)")
        else:
            log(f"  ✗ Failed")
        
        updated_data.append(item)

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(updated_data, f, ensure_ascii=False, indent=2)
    
    log("--- すべての音声生成とdurationの更新が完了しました ---")

if __name__ == "__main__":
    main()
