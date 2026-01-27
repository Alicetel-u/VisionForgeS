import os
from psd_tools import PSDImage
import PIL.Image

def export_standard_zundamon():
    psd_path = r"C:\Users\narak\Downloads\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3.psd"
    output_dir = r"c:\repos\VisionForge\video\public\images\characters\zundamon"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 完全に統一されたサイズで書き出すためにキャンバス全体のbboxを使う
    # 今回はcrop(bbox)を詳しく制御する
    
    print(f"Loading PSD: {psd_path}")
    psd = PSDImage.open(psd_path)
    
    def hide_everything(parent):
        for layer in parent:
            if hasattr(layer, 'visible'):
                layer.visible = False
            if hasattr(layer, '__iter__'):
                hide_everything(layer)

    def find_all_layers(parent, name):
        matches = []
        for layer in parent:
            if layer.name == name:
                matches.append(layer)
            if hasattr(layer, '__iter__'):
                matches.extend(find_all_layers(layer, name))
        return matches

    def show_recursive(layer):
        if hasattr(layer, 'visible'):
            layer.visible = True
        curr = layer
        while hasattr(curr, 'parent') and curr.parent and curr.parent != psd:
            if hasattr(curr.parent, 'visible'):
                curr.parent.visible = True
            curr = curr.parent

    # スタンダードな構成
    # 服装1, いつもの服, 素体, 枝豆通常, 普通目(カメラ目線), 普通眉, んー(口), 腕:基本
    
    print("Configuring standard pose...")
    hide_everything(psd)

    # 必須パーツ
    basics = ["!素体", "!枝豆", "!右腕", "!左腕", "!目", "!口", "!眉", "!顔色", "*服装1", "*いつもの服", "*枝豆通常"]
    for b in basics:
        for l in find_all_layers(psd, b): show_recursive(l)

    # 腕：基本（素立ち）
    for l in find_all_layers(psd, "*基本"):
        if l.parent and l.parent.name in ["!右腕", "!左腕"]: show_recursive(l)

    # 顔：ノーマル
    # 目：普通目 -> カメラ目線
    eye_group = find_all_layers(psd, "*普通目")
    for l in eye_group:
        show_recursive(l)
        if hasattr(l, '__iter__'):
            for sub in l:
                if "カメラ目線" in sub.name: show_recursive(sub)
    
    # 黒目
    for l in find_all_layers(psd, "!黒目"): show_recursive(l)
    
    # 口：んー
    for l in find_all_layers(psd, "*んー"): show_recursive(l)
    
    # 眉：普通眉
    for l in find_all_layers(psd, "*普通眉"): show_recursive(l)

    # 背景・不要レイヤー削除
    for l in psd:
        if any(x in l.name for x in ["背景", "Layer", "Background"]):
            l.visible = False

    # 書き出し
    print("Compositing...")
    try:
        img = psd.composite(color=None)
    except:
        img = psd.composite()
    
    img = img.convert("RGBA")
    
    # 白背景除去
    if img.getpixel((0,0))[:3] == (255, 255, 255):
        print("Removing white background...")
        datas = img.getdata()
        newData = []
        for item in datas:
            if item[0] == 255 and item[1] == 255 and item[2] == 255:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        img.putdata(newData)

    # ここで「余白をカット」するが、今回は「全身が確実に収まる」基準を作るために
    # 一度だけカットして、そのサイズ感をユーザーに見てもらう。
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        print(f"Cropped Size: {img.size}")

    img.save(os.path.join(output_dir, "standard_test.png"))
    print("Exported standard_test.png")

if __name__ == "__main__":
    export_standard_zundamon()
