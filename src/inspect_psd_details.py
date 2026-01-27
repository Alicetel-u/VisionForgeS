import os
from psd_tools import PSDImage
import sys

# Windowsでの文字化け対策
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def inspect_psd_details():
    psd_path = r"C:\Users\narak\Downloads\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3.psd"
    
    print(f"Loading PSD: {psd_path}")
    psd = PSDImage.open(psd_path)

    # 目、口、眉に関連しそうなキーワード
    keywords = ["目", "口", "眉", "顔"]

    def walk(layers, path=""):
        for layer in layers:
            current_path = f"{path} > {layer.name}"
            
            # キーワードが含まれる、または '*' で始まるレイヤーを表示
            if any(k in layer.name for k in keywords) or layer.name.startswith("*"):
                print(f"{current_path}")
            
            if layer.is_group():
                walk(layer, current_path)

    print("--- Relevant Layers ---")
    walk(psd)

if __name__ == "__main__":
    inspect_psd_details()
