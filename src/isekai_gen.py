import os
import json
import requests
import wave
import contextlib
from dotenv import load_dotenv

load_dotenv()

VOICEVOX_URL = "http://127.0.0.1:50021"
SPEAKERS = {
    "metan": 2,      # 四国めたん
    "zundamon": 3,   # ずんだもん
    "kanon": 10      # カノン：雨晴はう
}

def get_audio_duration(file_path):
    try:
        with contextlib.closing(wave.open(file_path, 'r')) as f:
            return f.getnframes() / float(f.getframerate())
    except: return 0

def generate_voice(text, speaker_id, output_path):
    try:
        query = requests.post(f"{VOICEVOX_URL}/audio_query", params={"text": text, "speaker": speaker_id}, timeout=20)
        if query.status_code != 200: return False
        data = query.json()
        data["speedScale"] = 1.2
        synth = requests.post(f"{VOICEVOX_URL}/synthesis", params={"speaker": speaker_id}, json=data, timeout=60)
        if synth.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(synth.content)
            return True
    except: return False
    return False

def run():
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    PUBLIC_DIR = os.path.join(BASE_DIR, "video", "public")
    
    script = [
        {"speaker": "kanon", "emotion": "normal", "action": "none", "title": "異世界∞異世界の衝撃サ終！", "bgm": "bgm/bgm_cute_main.mp3", "text": "衝撃のニュースよ。コロプラの『異世界∞異世界』が、わずか1年ちょっとでサービス終了を発表したわ。"},
        {"speaker": "zundamon", "emotion": "panic", "action": "shiver", "title": "異世界∞異世界の衝撃サ終！", "text": "な、なななな…なんだってー！？ボクがコツコツ貯めた転生石はどうなっちゃうのだー！"},
        {"speaker": "kanon", "emotion": "angry", "action": "thinking", "title": "異世界∞異世界の衝撃サ終！", "text": "無に還るわ。正確には2026年4月。リリースからたった1年3ヶ月の短命だったわね。"},
        {"speaker": "zundamon", "emotion": "sad", "action": "fall_down", "title": "異世界∞異世界の衝撃サ終！", "text": "早すぎるのだ…！まさに異世界に転生した瞬間にトラックに跳ねられた気分なのだ…"},
        {"speaker": "kanon", "emotion": "normal", "action": "nod", "title": "まさかの「暖房器具」扱い！？", "bgm": "bgm/bgm_active_chase.mp3", "text": "評判は散々だったわよ。『長いロード時間』に『コンテンツ不足』、挙句の果てには『スマホの暖房器具』なんて言われてたわ。"},
        {"speaker": "zundamon", "emotion": "angry", "action": "angry_vibe", "title": "まさかの「暖房器具」扱い！？", "text": "暖房器具は失礼なのだ！…いや、確かにボクのスマホもアツアツであのままじゃ爆発するところだったのだ…"},
        {"speaker": "kanon", "emotion": "normal", "action": "discovery", "title": "豪華コラボの歴史", "text": "コラボだけは豪華だったんだけどね。無職転生に転スラ、SAO、シャンフロ…まさに異世界勢揃いだったわ。"},
        {"speaker": "zundamon", "emotion": "happy", "action": "jump", "title": "豪華コラボの歴史", "text": "夢の共演だったのだ！それだけで遊ぶ価値があった…と、ボクは信じたいのだ！"},
        {"speaker": "kanon", "emotion": "angry", "action": "thinking", "title": "ゲーム自体が異世界へ…", "bgm": "bgm/bgm_cute_main.mp3", "text": "でも結局、ゲームそのものが異世界（サ終）へ旅立っちゃったわね。皮肉なものだわ。"},
        {"speaker": "zundamon", "emotion": "panic", "action": "shiver", "title": "ゲーム自体が異世界へ…", "text": "笑えないのだ！ボクの思い出まで成仏しちゃうのだー！"},
        {"speaker": "kanon", "emotion": "happy", "action": "nod", "title": "さよなら異世界∞異世界", "text": "一応、オフライン版が出るらしいから、最後に見届けてあげなさいな。"},
        {"speaker": "zundamon", "emotion": "sad", "action": "fall_down", "title": "さよなら異世界∞異世界", "text": "助けてなのだー！ボクの財布も異世界転生して二度と帰ってこないのだー！"},
    ]

    final_data = []
    for i, line in enumerate(script):
        print(f"Generating scene {i+1}...")
        audio_rel = f"audio/isekai_{i}.wav"
        audio_full = os.path.join(PUBLIC_DIR, audio_rel)
        
        success = generate_voice(line["text"], SPEAKERS[line["speaker"]], audio_full)
        if success:
            line["id"] = i + 1
            line["audio"] = audio_rel
            line["duration"] = get_audio_duration(audio_full)
            # 背景画像を設定（適当にバラけさせる）
            if i < 4: line["bg_image"] = "images/bg_town.png"
            elif i < 8: line["bg_image"] = "images/bg_street.png"
            else: line["bg_image"] = "images/bg_park.png"
            final_data.append(line)
        else:
            print(f"Failed to generate voice for scene {i+1}")

    with open(os.path.join(PUBLIC_DIR, "cat_data.json"), 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    print("Generation complete!")

if __name__ == "__main__":
    run()
