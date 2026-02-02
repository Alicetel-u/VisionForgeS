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

def create_silence(output_path, duration_sec=3.0):
    """無音のwavファイルを生成します。"""
    try:
        if os.path.exists(output_path): return
        with wave.open(output_path, 'w') as f:
            f.setnchannels(1)
            f.setsampwidth(2)
            f.setframerate(44100)
            n_frames = int(44100 * duration_sec)
            data = b'\x00\x00' * n_frames
            f.writeframes(data)
    except Exception as e:
        log(f"  [WARNING] Silence creation failed: {e}")

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
        # 読み調整
        text = text.replace("SUUMO", "スーモ").replace("ＳＵＵＭＯ", "スーモ")
        text = text.replace("斜め上", "ななめうえ").replace("釣り人", "つりびと")
        text = text.replace("ネルギガンテ", "ねるぎがんて")
        
        query_payload = {"text": text, "speaker": speaker_id}
        query_response = requests.post(f"{VOICEVOX_URL}/audio_query", params=query_payload, timeout=20)
        if query_response.status_code != 200: 
            return False
            
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

def create_mh_video_data():
    """モンハン x SUUMO コラボ紹介動画データを生成します。"""
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    VIDEO_PUBLIC_DIR = os.path.join(BASE_DIR, "video", "public")
    
    for sub in ["audio", "images"]:
        path = os.path.join(VIDEO_PUBLIC_DIR, sub)
        if not os.path.exists(path): 
            os.makedirs(path)

    log("=" * 60)
    log("🐉 モンスターハンター x SUUMO コラボ動画の生成を開始します")
    log("=" * 60)

    # 画像クエリ
    image_queries = [
        # ユーザー提供画像 (保存済み)
        ("", "images/bg_mh_station.jpg"),
        ("", "images/bg_mh_redau.png"),
        ("", "images/bg_mh_nergigante.jpg"),
        ("", "images/bg_mh_rioreus.png"),
        ("", "images/bg_mh_jinouga.png"),
        ("", "images/bg_mh_furufuru.png"),
        ("", "images/bg_mh_airou.png"),
        ("", "images/bg_mh_lagiacrus.jpg"),
        ("gaming setup monster hunter style", "images/bg_mh_vibe.jpg"),
        ("modern apartment interior", "images/bg_ending_property.jpg"),
    ]

    log("\n📸 画像のダウンロード中...")
    for query, img_rel in image_queries:
        img_full = os.path.join(VIDEO_PUBLIC_DIR, img_rel)
        if query and not os.path.exists(img_full):
            download_image_pexels(query, img_full)

    # 台本定義 (話者, 感情, アクション, 背景, 台本, 左上のタイトル)
    raw_script = [
        ("kanon", "happy", "happy_hop", "images/bg_mh_vibe.jpg", "みなさんこんにちは！カノンです！今日は、あの国民的ゲームと住宅情報サイトの『衝撃のコラボ』を紹介します！", "モンハン × SUUMO 衝撃のコラボ！"),
        ("zundamon", "happy", "none", "images/bg_mh_vibe.jpg", "ずんだもんなのだ！住宅情報サイトって…もしかして、あのもふもふした緑のアイツなのだ？", "モンハン × SUUMO 衝撃のコラボ！"),
        ("kanon", "happy", "nod", "images/bg_mh_station.jpg", "その通り！モンハンとスーモのコラボ広告が、新宿駅などの主要駅ですっごく大きく掲出されているんです！", "主要駅に巨大広告が出現！"),
        ("zundamon", "surprised", "jump", "images/bg_mh_station.jpg", "うわあ、駅の壁一面モンハンなのだ！これなら嫌でも物件探しがはかどるのだ。", "主要駅に巨大広告が出現！"),
        
        # レ・ダウ (新モンスター)
        ("kanon", "happy", "discovery", "images/bg_mh_redau.png", "こちらは最新作のカギを握る『レ・ダウ』！『どれだけ放電しても大丈夫そうな砂丘』をマップで見つけたみたいですよ。", "【レ・ダウ】放電しても大丈夫な砂丘"),
        ("zundamon", "happy", "nod", "images/bg_mh_redau.png", "鳥取砂丘なのだ！スーモの『地図から検索』を使えば、モンスターの縄張りもバッチリ探せるのだ。", "【レ・ダウ】放電しても大丈夫な砂丘"),

        # ネルギガンテ
        ("kanon", "normal", "thinking", "images/bg_mh_nergigante.jpg", "滅尽龍ネルギガンテは『デザイナーズ物件』を希望しています。リフォーム済みでＤＩＹ可、さらに楽器相談可と、意外とこだわり派なんです。", "【ネルギガンテ】楽器可デザイナーズ"),
        ("zundamon", "surprised", "shiver", "images/bg_mh_nergigante.jpg", "音楽が趣味なのだ？さては宝玉を隠すために床下収納も欲しがっているのだ？", "【ネルギガンテ】楽器可デザイナーズ"),

        # リオレウス
        ("kanon", "happy", "zoom_in", "images/bg_mh_rioreus.png", "おなじみのリオレウスは、バルコニー付きで床暖房完備！やっぱり空の王者は日当たりと開放感を重視するんですね。", "【リオレウス】開放的なバルコニー付き"),
        ("zundamon", "happy", "nod", "images/bg_mh_rioreus.png", "即入居可なのがニクイのだ。マイホームに帰ってきた感がすごいのだ。", "【リオレウス】開放的なバルコニー付き"),

        # ジンオウガ
        ("kanon", "happy", "happy_hop", "images/bg_mh_jinouga.png", "ジンオウガはオール電化にこだわっています。これなら自分の電気で節約できそうですよね。", "【ジンオウガ】雷狼竜、夢のオール電化"),
        ("zundamon", "happy", "thinking", "images/bg_mh_jinouga.png", "ルームシェア可なのも気になるのだ。ケルビと一緒に住むのだ？", "【ジンオウガ】雷狼竜、夢のオール電化"),

        # フルフル
        ("kanon", "panic", "shiver", "images/bg_mh_furufuru.png", "フルフルは角部屋で防音室。大きな声を出すから、ご近所トラブルを避けるためにも防音は必須条件みたいです。", "【フルフル】叫んでも安心！静かな防音室"),

        # アイルー
        ("kanon", "happy", "happy_hop", "images/bg_mh_airou.png", "アイルーは南向きで追い炊き風呂付き。やっぱり温かいお家が一番なのだにゃー！", "【アイルー】管理人付き・ポカポカ南向き"),

        # ラギアクルス
        ("kanon", "normal", "nod", "images/bg_mh_lagiacrus.jpg", "ラギアクルスは１階の物件で独立洗面所。水回りの重要性を分かっていますね。", "【ラギアクルス】水回り重視！独立洗面所"),

        # ネットの評判
        ("kanon", "happy", "zoom_in", "images/bg_ending_property.jpg", "『スーモのスタッフに絶対ガチ勢がいる』とネットで言われるほど、生態に合わせた物件選びが秀逸だと話題なんです！", "「スタッフにガチ勢がいる」と話題"),
        ("zundamon", "happy", "happy_hop", "images/bg_ending_property.jpg", "ワイルズを遊び尽くすために、ボクも防音室付きの新居を検討するのだ！みんなはどのモンスターのこだわり条件に共感したのだ？", "「スタッフにガチ勢がいる」と話題"),
    ]

    video_script = []
    SPEAKER_IDS = {"kanon": 10, "zundamon": 3}
    scene_id = 0
    audio_index = 0 # 音声ファイル名のインデックス管理用
    last_title = None

    # 無音音声の生成（カットイン用）
    silence_rel = "audio/silence.wav"
    silence_full = os.path.join(VIDEO_PUBLIC_DIR, silence_rel)
    create_silence(silence_full, duration_sec=1.2)

    log("\n🎤 音声生成中...")
    for speaker, emotion, action, image, text, title in raw_script:
        
        # トピック変更検知（初回含む）
        is_topic_change = (title != last_title)
        
        if is_topic_change:
            # カットインシーン（会話停止・タイトル強調）
            # 背景は次のシーンと同じ
            current_section = "ending" if "bg_ending" in image else "main"
            
            video_script.append({
                "id": scene_id + 1,
                "speaker": "system", 
                "emotion": "normal",
                "action": "none",
                "text": "", # テキストなし
                "title": title,
                "audio": silence_rel,
                "bg_image": image,
                "image": image, # 互換性のため
                "duration": 1.2, # トランジション時間（36フレーム）に合わせる
                
                "direction": {
                    "mood": "normal",
                    "importance": "climax", # タイトル強調
                    "isTopicChange": True,  # ここでアニメーション発動
                    "section": current_section
                },
                "telop": { "emphasisWords": [] },
                "camera": { "preset": "zoom_in" } # タイトルにズーム
            })
            scene_id += 1
            
        last_title = title
        
        # 本編シーン
        log(f"  Scene {scene_id} ({speaker}): {text[:25]}...")
        audio_rel = f"audio/mh_suumo_{audio_index}.wav"
        audio_full = os.path.join(VIDEO_PUBLIC_DIR, audio_rel)
        
        speaker_id = SPEAKER_IDS.get(speaker, 10)
        
        # 音声が既に存在する場合は生成をスキップ
        if os.path.exists(audio_full) or generate_voice(text, audio_full, speaker_id=speaker_id):

            # 強調ワードの簡易抽出
            emphasis_candidates = ["国民的ゲーム", "衝撃のコラボ", "巨大広告", "放電", "デザイナーズ", "オール電化", "防音室", "日当たり", "独立洗面所", "ガチ勢", "ワイルズ"]
            found_words = [w for w in emphasis_candidates if w in text]

            # 新しいリッチなデータ構造
            scene_data = {
                "id": scene_id + 1,
                "speaker": speaker,
                "emotion": emotion,
                "action": action,
                "text": text,
                "title": title,
                "audio": audio_rel,
                "bg_image": image,
                "image": image,
                "duration": get_audio_duration(audio_full) + 0.5,
                
                # Claude Code が要求した拡張フィールド
                "direction": {
                    "mood": "happy" if emotion == "happy" else "normal",
                    "importance": "normal",
                    "isTopicChange": False, # ここではアニメーションさせない（既にカットインで出ている）
                    "section": "ending" if "bg_ending" in image else "main"
                },
                "telop": {
                    "emphasisWords": found_words
                },
                "camera": {
                    "preset": "center" # 会話時はセンターカメラ
                }
            }
            video_script.append(scene_data)
            scene_id += 1
            audio_index += 1
        else:
            log(f"    ✗ 音声生成失敗")

    # エンディングパートの追加（generate_ending.pyの内容を統合）
    log("\n🎬 エンディング生成中...")
    
    # エンディング用画像（なければダウンロード）
    ending_bg_rel = "images/bg_ending_neon.jpg"
    ending_bg_full = os.path.join(VIDEO_PUBLIC_DIR, ending_bg_rel)
    if not os.path.exists(ending_bg_full):
        download_image_pexels("neon city night vibes", ending_bg_full)

    ending_script = [
        {"speaker": "zundamon", "emotion": "panic", "action": "shiver", "text": "ふぅ…今回も濃いニュースだったのだ。ボク、もうお腹いっぱいなのだ。", "title": "エンディング"},
        {"speaker": "kanon", "emotion": "happy", "action": "nod", "text": "何言ってるの、まだ始まったばかりよ。次も面白いネタを探してこなきゃね。", "title": "エンディング"},
        {"speaker": "zundamon", "emotion": "happy", "action": "happy_hop", "text": "そうなのだ！というわけで、みんなの感想もコメント欄で待ってるのだ！", "title": "エンディング"},
        {"speaker": "kanon", "emotion": "happy", "action": "wave", "text": "チャンネル登録と高評価も、忘れないでちょうだいね。それじゃあ、またね！", "title": "エンディング"},
    ]

    for i, item in enumerate(ending_script):
        log(f"  Ending {i} ({item['speaker']}): {item['text'][:15]}...")
        audio_rel = f"audio/ending_{i}.wav"
        audio_full = os.path.join(VIDEO_PUBLIC_DIR, audio_rel)
        
        speaker_id = SPEAKER_IDS.get(item["speaker"], 10)
        
        # 音声生成（存在確認付き）
        if not os.path.exists(audio_full):
            generate_voice(item["text"], audio_full, speaker_id=speaker_id)
            
        video_script.append({
            "id": scene_id + 1,
            "speaker": item["speaker"],
            "emotion": item["emotion"],
            "action": item["action"],
            "text": item["text"],
            "title": item["title"],
            "audio": audio_rel,
            "bg_image": ending_bg_rel, # エンディング専用背景
            "image": ending_bg_rel,
            "duration": get_audio_duration(audio_full) + 0.5,
            
            # エンディング用の特別演出
            "direction": {
                "mood": "happy",
                "importance": "normal",
                "isTopicChange": i == 0, # エンディング開始時にトランジション
                "section": "ending_fixed" # 専用セクション名
            },
            "bgm": "bgm/bgm_ending.mp3" if i == 0 else None, # BGM切り替え
            "telop": { "emphasisWords": [] },
            "camera": { "preset": "center" }
        })
        scene_id += 1

    json_path = os.path.join(VIDEO_PUBLIC_DIR, "cat_data.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(video_script, f, ensure_ascii=False, indent=2)
    
    log(f"\n✅ 完了！ 保存先: {json_path}")

if __name__ == "__main__":
    create_mh_video_data()
