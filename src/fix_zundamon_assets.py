import os
from psd_tools import PSDImage
import PIL.Image

def fix_zundamon_assets():
    psd_path = r"C:\Users\narak\Downloads\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3.psd"
    output_dir = r"c:\repos\VisionForge\video\public\images\characters\zundamon"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
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

    # 1. まずスタンダードなポーズを作って、そのBBox（切り抜き範囲）を取得・固定する
    print("Determining standard crop box...")
    hide_everything(psd)
    
    # Standard Config
    basics = ["!素体", "!枝豆", "!右腕", "!左腕", "!目", "!口", "!眉", "!顔色", "*服装1", "*いつもの服", "*枝豆通常"]
    for b in basics:
        for l in find_all_layers(psd, b): show_recursive(l)
    for l in find_all_layers(psd, "*基本"): # Arms
        if l.parent and l.parent.name in ["!右腕", "!左腕"]: show_recursive(l)
    
    # Face: Normal
    for l in find_all_layers(psd, "*普通目"):
        show_recursive(l)
        if hasattr(l, '__iter__'):
            for sub in l:
                if "カメラ目線" in sub.name: show_recursive(sub)
    for l in find_all_layers(psd, "!黒目"): show_recursive(l)
    for l in find_all_layers(psd, "*んー"): show_recursive(l)
    for l in find_all_layers(psd, "*普通眉"): show_recursive(l)
    
    # Remove BG
    for l in psd:
        if any(x in l.name for x in ["背景", "Layer", "Background"]):
            l.visible = False

    # Composite & Get BBox
    try: img_std = psd.composite(color=None)
    except: img_std = psd.composite()
    img_std = img_std.convert("RGBA")
    
    # White BG removal for bbox calc
    datas = img_std.getdata()
    if datas[0][:3] == (255, 255, 255):
        newData = []
        for item in datas:
            if item[0] == 255 and item[1] == 255 and item[2] == 255:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        img_std.putdata(newData)

    standard_bbox = img_std.getbbox()
    print(f"Standard BBox determined: {standard_bbox}")
    
    # マージンを追加（頭や横にはみ出すアクション用）
    # left, top, right, bottom
    # standard_bbox = (left, top, right, bottom)
    # 幅広に、上を少し余裕持たせる
    margin_x = 50
    margin_top = 50
    margin_bottom = 0 # 足元は固定したいのでそのまま
    
    final_crop = (
        max(0, standard_bbox[0] - margin_x),
        max(0, standard_bbox[1] - margin_top),
        min(img_std.width, standard_bbox[2] + margin_x),
        min(img_std.height, standard_bbox[3] + margin_bottom)
    )
    print(f"Final Crop Box: {final_crop}")

    # 2. 全感情をこのCrop Boxで書き出す
    emotions = {
        "normal": ("*普通目", "*あ", "*普通眉", None),
        "happy": ("*にっこり", "*んへー", "*普通眉", None),
        "angry": ("*ジト目", "*△", "*怒り眉", "*ほっぺ赤め"),
        "sad": ("*なごみ目", "*むー", "*困り眉1", None),
        "panic": ("*〇〇", "*はへえ", "*普通眉", "*青ざめ")
    }

    arm_pose = "*基本"
    
    for name, config in emotions.items():
        eye, mouth, brow, effect = config
        print(f"Generating {name}...")
        hide_everything(psd)
        
        # Basics
        for b in basics:
            for l in find_all_layers(psd, b): show_recursive(l)
        
        # Arms
        for l in find_all_layers(psd, arm_pose):
            if l.parent and l.parent.name in ["!右腕", "!左腕"]: show_recursive(l)
        
        # Face Parts
        for part in [eye, mouth, brow, effect]:
            if not part: continue
            for l in find_all_layers(psd, part):
                show_recursive(l)
                if part == eye and hasattr(l, '__iter__'):
                    for sub in l:
                        if "カメラ目線" in sub.name: show_recursive(sub)
        
        for l in find_all_layers(psd, "!黒目"): show_recursive(l)
        
        # BG check
        for l in psd:
            if any(x in l.name for x in ["背景", "Layer", "Background"]):
                l.visible = False

        # Composite
        try: img = psd.composite(color=None)
        except: img = psd.composite()
        img = img.convert("RGBA")
        
        # White Keying
        if img.getpixel((0,0))[:3] == (255, 255, 255):
            datas = img.getdata()
            newData = []
            for item in datas:
                if item[0] == 255 and item[1] == 255 and item[2] == 255:
                    newData.append((255, 255, 255, 0))
                else:
                    newData.append(item)
            img.putdata(newData)
        
        # Fixed Crop
        img_cropped = img.crop(final_crop)
        img_cropped.save(os.path.join(output_dir, f"{name}.png"))
        print(f"Exported {name}.png with fixed crop.")

if __name__ == "__main__":
    fix_zundamon_assets()
