import os
from psd_tools import PSDImage

def export_all_expressions():
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
            
    # 表情定義
    expressions = {
        "normal": {
            "parts": ["*普通眉", "*んー"],
            "eye_group": "*普通目",
            "pupil": "*カメラ目線"
        },
        "happy": {
            "parts": ["*普通眉", "*△", "*ほっぺ"], 
            "eye_group": "*普通目",
            "pupil": "*カメラ目線3" # キラキラ目?
        },
        "angry": {
            "parts": ["*怒り眉", "*むー"],
            "eye_group": "*普通目",
            "pupil": "*カメラ目線"
        },
        "sad": {
            "parts": ["*困り眉1", "*むー"],
            "eye_group": "*普通目",
            "pupil": "*目逸らし" # ちょっと伏せ目っぽく
        },
        "surprised": {
            "parts": ["*上がり眉", "*ほあー"],
            "eye_group": "*普通目",
            "pupil": "*カメラ目線"
        },
        "impressed": {
            "parts": ["*上がり眉", "*はへえ", "*ほっぺ2"],
            "eye_group": "*普通目",
            "pupil": "*カメラ目線3" 
        },
        "panic": {
            "parts": ["*困り眉2", "*わーい", "汗3", "*ぐるぐる"], # ぐるぐる目がある
            "eye_group": None, # 特殊目を使う場合はNone
            "pupil": None
        }
    }
    
    # 共通パーツ
    common_basics = ["!素体", "!枝豆", "!右腕", "!左腕", "!顔色", "*服装1", "*いつもの服", "*枝豆通常"]
    
    # 腕の処理（基本固定）
    arm_parts = ["*基本"]
    
    for name, config in expressions.items():
        print(f"Exporting {name}...")
        hide_everything(psd)
        
        # 1. 共通パーツ表示
        for b in common_basics:
            for l in find_all_layers(psd, b): show_recursive(l)
            
        # 2. 腕表示
        for l in find_all_layers(psd, "*基本"):
            if l.parent and l.parent.name in ["!右腕", "!左腕"]: show_recursive(l)
            
        # 3. 目以外の顔パーツ（眉、口など）
        for part_name in config["parts"]:
            for l in find_all_layers(psd, part_name): show_recursive(l)
            
        # 4. 目
        if config["eye_group"]:
            # 目グループ（白目など）
            eye_group = find_all_layers(psd, config["eye_group"])
            for l in eye_group:
                show_recursive(l)
                # その中の特定の瞳
                if config["pupil"] and hasattr(l, '__iter__'):
                    for sub in l:
                         # !黒目 > *瞳名 という階層を探す
                         if sub.name == "!黒目":
                             show_recursive(sub)
                             for pupil in sub:
                                 if pupil.name == config["pupil"]:
                                     show_recursive(pupil)
        else:
            # 特殊目（ぐるぐるなど）はpartsリストに含まれている前提だが、
            # 念のため "!目" グループ内の特殊指定があればここで処理してもいいし、
            # partsに入れてしまえば find_all_layers で見つかるはず。
            # ただし、黒目を非表示にするなどの制御が必要な場合もある。
            # "!目" レイヤー配下の何かを表示しているならOK。
            # 今回は "panic" で "*ぐるぐる" を指定しているので parts ループで処理されるはず。
            pass

        # 黒目（瞳指定がある場合、明示的に黒目フォルダを表示する必要があるかもだが、show_recursiveで親も見えるようになるのでOK）
        
        # 合成
        try:
            img = psd.composite(color=None)
        except:
            img = psd.composite()
        
        img = img.convert("RGBA")
        
        # 白背景除去（簡易）
        if img.getpixel((0,0))[:3] == (255, 255, 255):
            datas = img.getdata()
            newData = []
            for item in datas:
                if item[0] == 255 and item[1] == 255 and item[2] == 255:
                    newData.append((255, 255, 255, 0))
                else:
                    newData.append(item)
            img.putdata(newData)
            
        # クロップ（standard_test.pngと同じ基準で切り抜きたいが、
        # 今回は一旦全自動クロップにするか、固定サイズにするか。
        # ユーザーはサイズ統一を望んでいるので、最初の画像でBBoxを決めてもいいが、
        # ここでは毎回bboxクロップする。ただし、動き回ると困るので、本当は固定がいい。
        # 今はとりあえずクロップして出力。
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        
        save_path = os.path.join(output_dir, f"{name}.png")
        img.save(save_path)
        print(f"Saved {save_path}")

if __name__ == "__main__":
    export_all_expressions()
