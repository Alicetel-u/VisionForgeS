import feedparser
import os
import json
from gtts import gTTS
import requests
from dotenv import load_dotenv

# 環境変数を読み込む
load_dotenv()

def fetch_latest_news():
    """ゲームニュースのRSSからトピックスを取得します。"""
    RSS_URL = "https://www.4gamer.net/rss/index.xml" 
    print(f"ニュースを取得中: {RSS_URL}")
    feed = feedparser.parse(RSS_URL)
    news_items = []
    for entry in feed.entries[:1]:
        summary = getattr(entry, 'summary', getattr(entry, 'description', ""))
        news_items.append({"title": entry.title, "summary": summary, "link": entry.link})
        print(f"・{entry.title}")
    return news_items

def download_image_pexels(query, output_path):
    """Pexels APIを使用して画像をダウンロードします。"""
    print(f"画像をPexels APIで検索中: {query}")
    
    # APIキーを環境変数から取得
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        print("⚠️ PEXELS_API_KEYが設定されていません。.envファイルを確認してください。")
        return False
    
    try:
        # Pexels API検索エンドポイント
        url = "https://api.pexels.com/v1/search"
        headers = {"Authorization": api_key}
        params = {
            "query": query,
            "per_page": 1,  # 最初の1枚だけ取得
            "orientation": "landscape"  # 横向き画像（動画に適している）
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # 検索結果があるか確認
            if data.get("photos") and len(data["photos"]) > 0:
                # 最初の画像のURLを取得（大サイズ）
                image_url = data["photos"][0]["src"]["large2x"]
                photographer = data["photos"][0]["photographer"]
                
                print(f"✓ 画像が見つかりました（撮影者: {photographer}）")
                
                # 画像をダウンロード
                img_response = requests.get(image_url, timeout=10)
                if img_response.status_code == 200:
                    with open(output_path, "wb") as f:
                        f.write(img_response.content)
                    print(f"✓ 画像を保存しました: {output_path}")
                    return True
            else:
                print(f"⚠️ 検索結果が見つかりませんでした: {query}")
                return False
        else:
            print(f"⚠️ Pexels APIエラー（ステータス: {response.status_code}）")
            return False
            
    except Exception as e:
        print(f"⚠️ 画像取得エラー (Pexels): {e}")
        return False

def fix_reading_errors(text):
    """VOICEVOXの読み間違いを修正するためにテキストを前処理します。"""
    import re
    
    # 置換ルール（順番が重要）
    replacements = [
        # 記号の除去・調整
        ("!!", ""),
        ("！！", ""),
        ("‼", ""),  # 全角
        
        # 英語のカタカナ化
        ("TV", "テレビ"),
        ("PC", "ピーシー"),
        ("DLC", "ディーエルシー"),
        
        # よくあるゲーム用語
        ("FPS", "エフピーエス"),
        ("RPG", "アールピージー"),
        ("VR", "ブイアール"),
        
        # 句読点の調整（自然な間を作る）
        ("。。", "。"),
        
        # 固有名詞にスペースを入れて読みやすく
        ("カプコンTV", "カプコン テレビ"),
        ("モンスターハンターストーリーズ", "モンスターハンター ストーリーズ"),
    ]
    
    # 置換を実行
    for old, new in replacements:
        text = text.replace(old, new)
    
    # 日付の読み方調整（例: 1月27日 → いちがつにじゅうななにち）
    # 数字の後に「月」「日」「年」が続く場合は自動的に正しく読まれることが多いのでそのまま
    
    # 連続する句点を整理
    text = re.sub(r'。+', '。', text)
    
    # 不要な空白を整理
    text = re.sub(r'\s+', ' ', text)
    
    return text

def generate_voice(text, output_path):
    """VOICEVOXを使用して音声を生成します。"""
    print(f"音声を生成中（VOICEVOX）: {output_path}")
    
    # VOICEVOXのエンドポイント
    VOICEVOX_URL = "http://localhost:50021"
    
    # 話者ID（8=春日部つむぎ ノーマル - ニュースに適した落ち着いた声）
    # その他の選択肢: 2=四国めたん, 3=ずんだもん, 10=雨晴はう
    SPEAKER_ID = 8
    
    try:
        # テキストの前処理（読み間違い修正）
        fixed_text = fix_reading_errors(text)
        print(f"  ステップ1: 音声クエリを作成中...")
        query_response = requests.post(
            f"{VOICEVOX_URL}/audio_query",
            params={"text": fixed_text, "speaker": SPEAKER_ID},
            timeout=30
        )
        
        if query_response.status_code != 200:
            print(f"  ⚠️ クエリ作成エラー: {query_response.status_code}")
            return False
        
        # 音声の生成
        print(f"  ステップ2: 音声を合成中...")
        synthesis_response = requests.post(
            f"{VOICEVOX_URL}/synthesis",
            params={"speaker": SPEAKER_ID},
            json=query_response.json(),
            timeout=30
        )
        
        if synthesis_response.status_code != 200:
            print(f"  ⚠️ 音声合成エラー: {synthesis_response.status_code}")
            return False
        
        # 音声ファイルの保存
        with open(output_path, "wb") as f:
            f.write(synthesis_response.content)
        
        print(f"  ✓ 音声生成完了！（話者: 春日部つむぎ）")
        return True
        
    except requests.exceptions.ConnectionError:
        print(f"  ⚠️ VOICEVOXに接続できませんでした。VOICEVOXが起動しているか確認してください。")
        return False
    except Exception as e:
        print(f"  ⚠️ 音声生成エラー: {e}")
        return False

def create_news_data():
    """ニュースを取得し、すべてを生成します。"""
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    VIDEO_PUBLIC_DIR = os.path.join(BASE_DIR, "video", "public")
    
    for sub in ["audio", "images"]:
        path = os.path.join(VIDEO_PUBLIC_DIR, sub)
        if not os.path.exists(path): os.makedirs(path)

    news_list = fetch_latest_news()
    video_script = []
    
    for i, news in enumerate(news_list):
        audio_rel = f"audio/news_voice_{i}.mp3"
        image_rel = f"images/news_image_{i}.jpg"
        audio_full = os.path.join(VIDEO_PUBLIC_DIR, audio_rel)
        image_full = os.path.join(VIDEO_PUBLIC_DIR, image_rel)
        
        # 音声生成
        full_text = f"{news['title']}。 {news['summary']}"
        generate_voice(full_text, audio_full)
        
        # 画像検索用クエリ（Pexels APIは英語の方が結果が良い）
        # ニュースタイトルに「ゲーム」系のキーワードを追加
        search_query = "video game gaming"  # 汎用的なゲーム画像を検索
        success = download_image_pexels(search_query, image_full)
        
        video_script.append({
            "id": i,
            "title": news['title'],
            "summary": news['summary'],
            "audio": audio_rel,
            "image": image_rel if success else None
        })

    json_path = os.path.join(VIDEO_PUBLIC_DIR, "news_data.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(video_script, f, ensure_ascii=False, indent=2)
    
    print(f"\nすべての準備が完了しました！")

if __name__ == "__main__":
    create_news_data()
