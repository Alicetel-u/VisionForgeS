import os
from psd_tools import PSDImage
from PIL import Image

def export_zundamon():
    psd_path = r"C:\Users\narak\Downloads\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3.psd"
    output_dir = r"c:\repos\VisionForge\video\public\images\characters\zundamon"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print(f"Loading PSD: {psd_path}")
    psd = PSDImage.open(psd_path)
    
    # helper to find layers by name
    def find_layer(name, parent=psd):
        for layer in parent:
            if name in layer.name:
                return layer
            if hasattr(layer, '__iter__'):
                found = find_layer(name, layer)
                if found:
                    return found
        return None

    # Helper to print structure (debug)
    def print_layers(parent, indent=0):
        for layer in parent:
            print("  " * indent + f"{layer.name} (Visible: {layer.is_visible()})")
            if hasattr(layer, '__iter__'):
                print_layers(layer, indent + 1)

    print("--- Layer Structure ---")
    # print_layers(psd) # Might be too big, let's just try to find common ones

    # emotions to export
    # Each emotion is a combination of base + eye + mouth
    emotions = {
        "normal": {"eyes": "通常", "mouth": "通常"},
        "happy": {"eyes": "通常", "mouth": "笑い"}, # Or smile eyes if found
        "angry": {"eyes": "ジト目", "mouth": "への字"},
        "sad": {"eyes": "困り", "mouth": "困り"},
        "panic": {"eyes": "驚き", "mouth": "あぐあぐ"}
    }
    
    # Sakamoto Ahiru's Zundamon usually has "後髪", "体", "顔", "前髪"
    # And under "顔" there are "目", "口", "眉"
    
    # Let's try to export the whole image with specific layers visible
    def set_visibility(target_eyes, target_mouth):
        # Hide all eye and mouth options first, then show targets
        face = find_layer("顔")
        if face:
            eyes_group = find_layer("目", face)
            mouth_group = find_layer("口", face)
            
            if eyes_group:
                for eye in eyes_group:
                    eye.visible = (target_eyes in eye.name)
            
            if mouth_group:
                for mouth in mouth_group:
                    mouth.visible = (target_mouth in mouth.name)

    # Actually, psd-tools 'compose'/'composite' is best for this.
    # But it's easier to just save the layers I want.
    
    # For now, let's just export the default (usually normal) to verify it works
    print("Exporting normal.png...")
    psd.composite().save(os.path.join(output_dir, "normal.png"))
    
    # I'll stop here and check the normal first to see if it's correct.
    # If the user likes it, I'll refine the other 4.

if __name__ == "__main__":
    export_zundamon()
