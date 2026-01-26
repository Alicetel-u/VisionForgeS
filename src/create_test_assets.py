from PIL import Image, ImageDraw, ImageFont
import os

def create_test_image(output_path):
    # 1920x1080の画像を作成（VisionForgeの文字入り）
    img = Image.new('RGB', (1920, 1080), color=(30, 30, 30))
    d = ImageDraw.Draw(img)
    
    # 簡易的な図形を描画
    d.rectangle([100, 100, 1820, 980], outline=(255, 165, 0), width=10)
    
    # テキスト（フォントがない場合でも動くように標準を使用するか、描画を工夫）
    # ここではシンプルな背景＋四角形のみで、準備完了の合図とする
    print(f"テスト画像を生成中: {output_path}")
    img.save(output_path)

if __name__ == "__main__":
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_image_path = os.path.join(BASE_DIR, "inputs", "images", "test_background.png")
    
    if not os.path.exists(os.path.dirname(test_image_path)):
        os.makedirs(os.path.dirname(test_image_path))
        
    create_test_image(test_image_path)
    print("テスト画像の生成が完了しました。")
