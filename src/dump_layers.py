import os
from psd_tools import PSDImage

def dump_layer_names():
    psd_path = r"C:\Users\narak\Downloads\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3.psd"
    psd = PSDImage.open(psd_path)
    
    with open("layer_names.txt", "w", encoding="utf-8") as f:
        for layer in psd.descendants():
            f.write(layer.name + "\n")

if __name__ == "__main__":
    dump_layer_names()
