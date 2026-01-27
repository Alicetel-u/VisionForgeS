import os
import requests
from dotenv import load_dotenv

load_dotenv()

VOICEVOX_URL = "http://127.0.0.1:50021"
SPEAKER_ID = 10  # Kanon (Amehare Hau)

def generate_voice(text, output_path):
    print(f"Generating audio for: {text}")
    try:
        query = requests.post(f"{VOICEVOX_URL}/audio_query", params={"text": text, "speaker": SPEAKER_ID}, timeout=20)
        if query.status_code != 200:
            print(f"Query failed: {query.status_code}")
            return False
        data = query.json()
        data["speedScale"] = 1.2
        synth = requests.post(f"{VOICEVOX_URL}/synthesis", params={"speaker": SPEAKER_ID}, json=data, timeout=60)
        if synth.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(synth.content)
            print("Saved successfully.")
            return True
        else:
            print(f"Synthesis failed: {synth.status_code}")
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Target file: audio/isekai_8.wav
    # Original text: "でも結局、ゲームそのものが異世界（サ終）へ旅立っちゃったわね。皮肉なものだわ。"
    # Fixing pronunciation for "サ終" -> "サシュウ"
    
    text_for_audio = "でも結局、ゲームそのものが異世界サシュウへ旅立っちゃったわね。皮肉なものだわ。"
    output_path = r"c:\repos\VisionForge\video\public\audio\isekai_8.wav"
    
    generate_voice(text_for_audio, output_path)
