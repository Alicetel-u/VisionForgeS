import os
from moviepy.editor import ImageClip

def test_video_generation():
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    IMAGE_PATH = os.path.join(BASE_DIR, "inputs", "images", "test_background.png")
    OUTPUT_PATH = os.path.join(BASE_DIR, "outputs", "test_video.mp4")
    
    print(f"テスト動画の生成を開始します...")
    print(f"入力画像: {IMAGE_PATH}")
    
    if not os.path.exists(IMAGE_PATH):
        print(f"エラー: 入力画像が見つかりません。")
        return

    # 3秒間の動画を作成
    duration = 3
    clip = ImageClip(IMAGE_PATH).set_duration(duration)
    
    # 書き出し（デフォルトのエンコーダーを使用）
    clip.write_videofile(OUTPUT_PATH, fps=24, codec="libx264")
    print(f"テスト動画が生成されました: {OUTPUT_PATH}")

if __name__ == "__main__":
    test_video_generation()
