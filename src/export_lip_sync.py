import os
from psd_tools import PSDImage

def export_lip_sync_expressions():
    psd_path = r"C:\Users\narak\Downloads\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3.psd"
    output_dir = r"c:\repos\VisionForge\video\public\images\characters\zundamon"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print(f"Loading PSD: {psd_path}")
    psd = PSDImage.open(psd_path)
    
    # helper functions
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
            
    # expressions definition
    expressions = {
        "normal": {
            "brow": "*普通眉",
            "eye_group": "*目セット",
            "eye_white": "*普通白目",
            "pupil": "*カメラ目線",
            "lip_close": "*んー",
            "lip_open": "*んあー",
            "extras": []
        },
        "happy": {
            "brow": "*普通眉",
            "eye_group": "*目セット",
            "eye_white": "*普通白目",
            "pupil": "*カメラ目線3",
            "lip_close": "*むふ",
            "lip_open": "*ほあ",
            "extras": ["*ほっぺ"]
        },
        "angry": {
            "brow": "*怒り眉",
            "eye_group": "*目セット",
            "eye_white": "*普通白目",
            "pupil": "*カメラ目線",
            "lip_close": "*むー",
            "lip_open": "*お",
            "extras": []
        },
        "sad": {
            "brow": "*困り眉1",
            "eye_group": "*目セット",
            "eye_white": "*普通白目",
            "pupil": "*目逸らし",
            "lip_close": "*むー",
            "lip_open": "*ほー",
            "extras": []
        },
        "surprised": {
            "brow": "*上がり眉",
            "eye_group": "*目セット",
            "eye_white": "*普通白目",
            "pupil": "*カメラ目線", 
            "lip_close": "*お",
            "lip_open": "*ほあー",
            "extras": []
        },
        "panic": {
            "brow": "*困り眉2",
            "eye_group": None, 
            "pupil": None,
            "lip_close": "*わーい",
            "lip_open": "*ほあー",
            "extras": ["汗3", "*ぐるぐる"]
        },
        "impressed": {
             "brow": "*怒り眉",
             "eye_group": "*目セット",
             "eye_white": "*普通白目",
             "pupil": "*カメラ目線2",
             "lip_close": "*むふ",
             "lip_open": "*△",
             "extras": ["*ほっぺ"]
        }
    }
    
    # 共通パーツ
    common_basics = ["!素体", "!枝豆", "!右腕", "!左腕", "!顔色", "*服装1", "*いつもの服", "*枝豆通常"]
    
    for name, config in expressions.items():
        for state in ["close", "open"]:
            print(f"Exporting {name} ({state})...")
            hide_everything(psd)
            
            # 1. 共通パーツ
            for b in common_basics:
                for l in find_all_layers(psd, b): show_recursive(l)
                
            # 2. 腕
            for l in find_all_layers(psd, "*基本"):
                if l.parent and l.parent.name in ["!右腕", "!左腕"]: show_recursive(l)
                
            # 3. 眉
            if config.get("brow"):
                for l in find_all_layers(psd, config["brow"]): show_recursive(l)
                
            # 4. 目
            if config.get("eye_group"):
                # グループ自体を表示
                for l in find_all_layers(psd, config["eye_group"]): show_recursive(l)
                
                # 白目（明示的に指定があれば表示）
                if config.get("eye_white"):
                     for l in find_all_layers(psd, config["eye_white"]): show_recursive(l)

                # 瞳
                if config.get("pupil"):
                    pupil_name = config["pupil"]
                    for l in find_all_layers(psd, pupil_name):
                         # 親が !黒目 であるものを探す（誤爆防止）
                         if l.parent and l.parent.name == "!黒目":
                             show_recursive(l)
            
            # 5. エクストラ
            for ex in config.get("extras", []):
                for l in find_all_layers(psd, ex): show_recursive(l)
            
            # 6. 口
            lip_name = config[f"lip_{state}"]
            for l in find_all_layers(psd, lip_name): show_recursive(l)
            
            # 合成 & 保存
            try:
                img = psd.composite(color=None)
            except:
                img = psd.composite()
            
            img = img.convert("RGBA")
            
            # 白背景除去
            if img.getpixel((0,0))[:3] == (255, 255, 255):
                datas = img.getdata()
                newData = []
                for item in datas:
                    if item[0] == 255 and item[1] == 255 and item[2] == 255:
                        newData.append((255, 255, 255, 0))
                    else:
                        newData.append(item)
                img.putdata(newData)
            
            bbox = img.getbbox()
            if bbox:
                img = img.crop(bbox)
            
            filename = f"{name}_{state}.png"
            save_path = os.path.join(output_dir, filename)
            img.save(save_path)
            print(f"Saved {filename}")

if __name__ == "__main__":
    export_lip_sync_expressions()
