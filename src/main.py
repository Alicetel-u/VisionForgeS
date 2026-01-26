import os
from moviepy.editor import ImageClip, AudioFileClip

def create_simple_video(image_path, audio_path, output_path, duration=10):
    """
    指定された画像と音声からシンプルな動画を作成します。
    """
    print(f"動画生成を開始します... (Duration: {duration}s)")
    
    # 画像クリップの読み込み
    clip = ImageClip(image_path).set_duration(duration)
    
    # 音声クリップの読み込み
    audio = AudioFileClip(audio_path)
    # 動画の長さに合わせて音声を調整（ループまたはカット）
    if audio.duration > duration:
        audio = audio.subclip(0, duration)
    else:
        # 音声が短い場合はループさせるなどの処理が必要ですが、ここではシンプルに
        pass
        
    # 音声をセット
    clip = clip.set_audio(audio)
    
    # 書き出し
    clip.write_videofile(output_path, fps=24)
    print(f"動画が正常に生成されました: {output_path}")

if __name__ == "__main__":
    # 基本的なパスの設定
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    IMAGE_DIR = os.path.join(BASE_DIR, "inputs", "images")
    AUDIO_DIR = os.path.join(BASE_DIR, "inputs", "audio")
    OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

    print("VisionForge - Video Automation Start")
    print(f"Working Directory: {BASE_DIR}")
    
    # ここにメインの実行ロジックを記述していく
    # 現時点ではディレクトリの存在確認のみ
    for d in [IMAGE_DIR, AUDIO_DIR, OUTPUT_DIR]:
        if os.path.exists(d):
            print(f"[OK] Directory found: {d}")
        else:
            print(f"[ERROR] Directory NOT found: {d}")
