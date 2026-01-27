import os
import json
import sys
import feedparser
import re
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

def fetch_latest_news():
    """RSSフィードから最新のゲームニュースを取得します。"""
    rss_url = "https://www.4gamer.net/rss/index.xml"
    feed = feedparser.parse(rss_url)
    news_list = []
    
    for entry in feed.entries[:5]: # 上位5件
        news_list.append({
            "title": entry.title,
            "summary": re.sub(r'<.*?>', '', entry.summary)[:120]
        })
    return news_list

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

def fix_reading_errors(text):
    """読み間違いを修正し、英語をカタカナに変換します。"""
    replacements = [
        ("最新", "さいしん"), ("更新", "こうしん"), ("ｗｗｗ", "わらわらわら"),
        ("!!", "！"), ("！！", "！"),
        # 英語の読み調整 (単語として読んでほしいもの)
        ("ARC", "アーク"), ("Raiders", "レイダース"), ("Headwinds", "ヘッドウィンズ"),
        ("Game", "ゲーム"), ("News", "ニュース"), ("Solo", "ソロ"), ("Team", "チーム"),
        ("Update", "アップデート"), ("Review", "レビュー"), ("Play", "プレイ"),
        ("Pokemon", "ポケモン"), ("Park", "パーク"), ("Kanto", "カントー"),
        ("Wilds", "ワイルズ"), ("Monster", "モンスター"), ("Hunter", "ハンター")
    ]
    # 長い単語から順に置換
    replacements.sort(key=lambda x: len(x[0]), reverse=True)

    for old, new in replacements:
        # 単語境界を意識した正規表現
        text = re.sub(rf'\b{old}\b', new, text, flags=re.IGNORECASE)
        # 境界がない場合も対応
        text = text.replace(old, new)

    text = re.sub(r'「(.*?)」', r'\1', text)
    text = re.sub(r'。+', '。', text)
    text = re.sub(r'\s+', ' ', text)
    return text

VOICEVOX_URL = "http://127.0.0.1:50021"

def generate_voice(text, output_path, speaker_id=3):
    """VOICEVOX APIを使用して音声を生成します。"""
    clean_text = fix_reading_errors(text)
    try:
        query_payload = {"text": clean_text, "speaker": speaker_id}
        query_response = requests.post(f"{VOICEVOX_URL}/audio_query", params=query_payload, timeout=20)
        if query_response.status_code != 200: 
            return False
            
        query_data = query_response.json()
        query_data["speedScale"] = 1.25

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
    if not api_key: return False
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
                log(f"  [OK] 画像保存: {os.path.basename(output_path)}")
                return True
    except Exception:
        pass
    return False

def split_text_into_scenes(text, max_chars=40):
    """テキストを2行程度（約40文字）ずつに分割します。"""
    chunks = re.split(r'([、。！？」]+)', text)
    scenes = []
    current = ""
    
    for i in range(0, len(chunks)-1, 2):
        sentence = chunks[i] + chunks[i+1]
        if len(current) + len(sentence) > max_chars:
            if current: scenes.append(current.strip())
            current = sentence
        else:
            current += sentence
            
    if current:
        scenes.append(current.strip())
    
    final_scenes = []
    for s in scenes:
        while len(s) > max_chars:
            final_scenes.append(s[:max_chars])
            s = s[max_chars:]
        if s: final_scenes.append(s)
        
    return final_scenes

def create_news_data():
    """KANONソロスタイルのニュース動画データを生成します。"""
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    VIDEO_PUBLIC_DIR = os.path.join(BASE_DIR, "video", "public")
    
    for sub in ["audio", "images"]:
        path = os.path.join(VIDEO_PUBLIC_DIR, sub)
        if not os.path.exists(path): os.makedirs(path)

    log("ニュースを収集中...")
    news_list = fetch_latest_news()
    if not news_list:
        log("ニュースの取得に失敗しました。")
        return

    news = news_list[0]
    log(f"\n--- 特集ニュース: {news['title']} ---")

    img_rel = "images/news_main.jpg"
    img_full = os.path.join(VIDEO_PUBLIC_DIR, img_rel)
    download_image_pexels(f"{news['title']}", img_full)

    # 原稿定義 (KANONソロスタイル)
    raw_script = [
        ("happy", "みなさん、こんにちは！ゲームナビゲーターのカノンです！"),
        ("surprised", f"今日の注目ニュースはこちら！{news['title']}が話題になっています！"),
        ("panic", "ええっ！？これ、予想以上の急展開じゃないですか！？"),
        ("normal", f"内容を詳しく見ていきましょう。{news['summary']}...とのことですよ。"),
        ("happy", "これ、個人的にもエンジニア心がくすぐられるというか、すごくワクワクしますね！"),
        ("normal", "デザインも洗練されていますし、実際に体験できる日が待ち遠しいです！"),
        ("happy", "みなさんはどう思いましたか？ぜひコメントで教えてくださいね！それじゃあ、またね！"),
    ]

    video_script = []
    # 雨晴はう (ノーマル: 10) に固定
    KANON_SPEAKER_ID = 10
    scene_id = 0

    for emotion, text in raw_script:
        sub_texts = split_text_into_scenes(text)
        for sub_text in sub_texts:
            log(f"音声生成中 (Scene {scene_id}): {sub_text[:20]}...")
            audio_rel = f"audio/kanon_scene_{scene_id}.wav"
            audio_full = os.path.join(VIDEO_PUBLIC_DIR, audio_rel)
            
            # 雨晴はうの声で生成
            if generate_voice(sub_text, audio_full, speaker_id=KANON_SPEAKER_ID):
                video_script.append({
                    "id": scene_id,
                    "speaker": "kanon",
                    "emotion": emotion,
                    "text": sub_text,
                    "audio": audio_rel,
                    "image": img_rel,
                    "duration": get_audio_duration(audio_full)
                })
                scene_id += 1

    json_path = os.path.join(VIDEO_PUBLIC_DIR, "news_data.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(video_script, f, ensure_ascii=False, indent=2)
    
    log(f"\n[完了] データを生成しました: {json_path}")

if __name__ == "__main__":
    create_news_data()
