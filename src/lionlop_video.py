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

def create_lionlop_video_data():
    """ライオンロップイヤーの生態紹介動画データを生成します。"""
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    VIDEO_PUBLIC_DIR = os.path.join(BASE_DIR, "video", "public")
    
    for sub in ["audio", "images"]:
        path = os.path.join(VIDEO_PUBLIC_DIR, sub)
        if not os.path.exists(path): 
            os.makedirs(path)
            log(f"[OK] ディレクトリ作成: {path}")

    log("=" * 60)
    log("🐰 ライオンロップイヤー生態紹介動画の生成を開始します")
    log("=" * 60)

    # 画像クエリと保存先のマッピング
    image_queries = [
        ("lion head rabbit fluffy", "images/lionlop_main.jpg"),
        ("cute rabbit ears", "images/lionlop_face.jpg"),
        ("rabbit eating hay", "images/lionlop_eating.jpg"),
        ("rabbit grooming brushing", "images/lionlop_care.jpg"),
        ("happy rabbit playing", "images/lionlop_happy.jpg"),
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
        ("kanon", "surprised", "images/lionlop_main.jpg", "今日は、ライオンのたてがみのような毛並みが特徴的な、ライオンロップイヤーについて紹介します！"),
        ("zundamon", "surprised", "images/lionlop_main.jpg", "おお！ライオンみたいなウサギなのだ？すごく可愛いのだ！"),
        ("kanon", "happy", "images/lionlop_face.jpg", "そうなんです！顔の周りにふわふわの飾り毛があって、耳はスプーンのように丸く垂れているんですよ。"),
        ("zundamon", "happy", "images/lionlop_face.jpg", "本当だのだ！ふわふわで触りたくなるのだ！"),
        ("kanon", "normal", "images/lionlop_face.jpg", "体重は約1.5キロから3キロほどで、小さくて抱っこしやすいサイズなんです。"),
        ("zundamon", "normal", None, "性格はどうなのだ？人懐っこいのだ？"),
        ("kanon", "happy", "images/lionlop_happy.jpg", "とっても人懐っこくて、甘えん坊な子が多いんですよ。抱っこや撫でられることが大好きなので、飼育初心者の方にもおすすめです！"),
        ("zundamon", "happy", "images/lionlop_happy.jpg", "いいのだ！一緒に遊べそうなのだ！"),
        ("kanon", "normal", "images/lionlop_eating.jpg", "ウサギは朝方と夕方に活発になるので、お世話のタイミングも大切なんです。日中は寝ていることが多いですよ。"),
        ("zundamon", "normal", None, "なるほどなのだ。飼育で気を付けることはあるのだ？"),
        ("kanon", "panic", "images/lionlop_care.jpg", "実は、長い毛を持つため、毛づくろいの際に毛を飲み込みやすくて、毛球症になりやすいんです！"),
        ("zundamon", "surprised", "images/lionlop_care.jpg", "えっ！それは大変なのだ！"),
        ("kanon", "normal", "images/lionlop_care.jpg", "こまめなブラッシングと、繊維質が豊富な牧草をたくさん与えることが大切です。あと、暑さにも弱いので温度管理も重要ですね。"),
        ("zundamon", "normal", None, "ちゃんとケアしてあげれば、長く一緒にいられるのだ！"),
        ("kanon", "happy", "images/lionlop_happy.jpg", "その通り！人によく懐くので、積極的にコミュニケーションを取ると、もっと仲良くなれますよ！"),
        ("zundamon", "happy", "images/lionlop_main.jpg", "カノン、ずんだもんもウサギさん飼いたくなったのだ！"),
        ("kanon", "happy", "images/lionlop_main.jpg", "私も癒されました！みなさんもぜひ、この愛らしいライオンロップイヤーとの生活を検討してみてくださいね！"),
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
        audio_rel = f"audio/lionlop_scene_{scene_id}.wav"
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
                "duration": get_audio_duration(audio_full)
            })
            log(f"    ✓ 音声生成完了 (長さ: {get_audio_duration(audio_full):.2f}秒)")
            scene_id += 1
        else:
            log(f"    ✗ 音声生成失敗")

    json_path = os.path.join(VIDEO_PUBLIC_DIR, "lionlop_data.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(video_script, f, ensure_ascii=False, indent=2)
    
    log("\n" + "=" * 60)
    log(f"✅ ライオンロップイヤー動画データの生成が完了しました！")
    log(f"📁 保存先: {json_path}")
    log(f"🎬 総シーン数: {len(video_script)}")
    total_duration = sum(scene["duration"] for scene in video_script)
    log(f"⏱️  総再生時間: {total_duration:.2f}秒 ({total_duration/60:.1f}分)")
    log("=" * 60)

if __name__ == "__main__":
    create_lionlop_video_data()
