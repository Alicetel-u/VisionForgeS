import os
from psd_tools import PSDImage
import PIL.Image

def export_zundamon_emotions():
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

    # Basics
    basics = ["!素体", "!枝豆", "!右腕", "!左腕", "!目", "!口", "!眉", "!顔色", "*服装1", "*いつもの服", "*枝豆通常"]
    arm_pose = "*基本"

    # Emotions (eye, mouth, brow, effect)
    emotions = {
        "normal": ("*普通目", "*んー", "*普通眉", None),
        "happy": ("*にっこり", "*んへー", "*普通眉", None),
        "angry": ("*ジト目", "*△", "*怒り眉", "*ほっぺ赤め"),
        "sad": ("*なごみ目", "*むー", "*困り眉1", None),
        "panic": ("*〇〇", "*はへえ", "*普通眉", "*青ざめ")
    }

    for name, config in emotions.items():
        eye, mouth, brow, effect = config
        print(f"Generating {name}...")
        hide_everything(psd)
        
        for b in basics:
            for l in find_all_layers(psd, b): show_recursive(l)
        
        for l in find_all_layers(psd, arm_pose):
            if l.parent and l.parent.name in ["!右腕", "!左腕"]: show_recursive(l)
        
        for part in [eye, mouth, brow, effect]:
            if not part: continue
            for l in find_all_layers(psd, part):
                show_recursive(l)
                if part == eye and hasattr(l, '__iter__'):
                    for sub in l:
                        if "カメラ目線" in sub.name: show_recursive(sub)
            
        for l in find_all_layers(psd, "!黒目"): show_recursive(l)

        # Ensure no root background
        for l in psd:
            if any(x in l.name for x in ["背景", "Layer", "Background"]):
                l.visible = False

        # Try to composite with transparency
        try:
            # First try without color to see if it works
            img = psd.composite(color=None)
        except:
            print("Transparency failed, using default...")
            img = psd.composite()

        # If it's RGB or has white bg, do the white-keying
        img = img.convert("RGBA")
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

        # 余白をカットして接地しやすくする
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)

        img.save(os.path.join(output_dir, f"{name}.png"))
        print(f"Exported {name}.png")

if __name__ == "__main__":
    export_zundamon_emotions()
