import feedparser
import os
import json
from gtts import gTTS
import shutil
import requests
from duckduckgo_search import DDGS

def fetch_latest_news():
    """YahooニュースのRSSから主要トピックスを取得します。"""
    RSS_URL = "https://news.yahoo.co.jp/rss/topics/top-picks.xml"
    print(f"ニュースを取得中: {RSS_URL}")
    feed = feedparser.parse(RSS_URL)
    news_items = []
    for entry in feed.entries[:3]:
        summary = getattr(entry, 'summary', getattr(entry, 'description', ""))
        news_items.append({"title": entry.title, "summary": summary, "link": entry.link})
        print(f"・{entry.title}")
    return news_items

def download_image(query, output_path):
    """ニュース内容に関連する画像を検索して保存します。"""
    print(f"画像を検索中: {query}")
    try:
        with DDGS() as ddgs:
            results = ddgs.images(query, max_results=1)
            if results:
                image_url = results[0]['image']
                print(f"画像が見つかりました: {image_url}")
                response = requests.get(image_url, timeout=10)
                if response.status_code == 200:
                    with open(output_path, 'wb') as f:
                        f.write(response.content)
                    return True
    except Exception as e:
        print(f"画像取得エラー: {e}")
    return False

def generate_voice(text, output_path):
    """テキストから音声を生成します。"""
    print(f"音声を生成中: {output_path}")
    tts = gTTS(text=text, lang='ja')
    tts.save(output_path)

def create_news_data():
    """ニュースを取得し、音声、画像、メタデータを作成します。"""
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    VIDEO_PUBLIC_DIR = os.path.join(BASE_DIR, "video", "public")
    
    # フォルダ準備
    for sub in ["audio", "images"]:
        path = os.path.join(VIDEO_PUBLIC_DIR, sub)
        if not os.path.exists(path): os.makedirs(path)

    news_list = fetch_latest_news()
    video_script = []
    
    for i, news in enumerate(news_list):
        # パス設定
        audio_rel = f"audio/news_voice_{i}.mp3"
        image_rel = f"images/news_image_{i}.jpg"
        audio_full = os.path.join(VIDEO_PUBLIC_DIR, audio_rel)
        image_full = os.path.join(VIDEO_PUBLIC_DIR, image_rel)
        
        # 音声生成
        full_text = f"{news['title']}。 {news['summary']}"
        generate_voice(full_text, audio_full)
        
        # 画像取得 (タイトルを検索ワードにする)
        success = download_image(news['title'], image_full)
        
        video_script.append({
            "id": i,
            "title": news['title'],
            "summary": news['summary'],
            "audio": audio_rel,
            "image": image_rel if success else None
        })

    # JSON保存
    json_path = os.path.join(VIDEO_PUBLIC_DIR, "news_data.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(video_script, f, ensure_ascii=False, indent=2)
    
    print(f"\nすべての準備が完了しました！")

if __name__ == "__main__":
    create_news_data()
