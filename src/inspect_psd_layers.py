import os
from psd_tools import PSDImage

def inspect_psd_structure():
    psd_path = r"C:\Users\narak\Downloads\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3.psd"
    
    print(f"Loading PSD: {psd_path}")
    psd = PSDImage.open(psd_path)

    def print_layers(layers, indent=0):
        for layer in layers:
            print("  " * indent + f"- {layer.name} (visible={layer.visible})")
            if layer.is_group():
                print_layers(layer, indent + 1)

    print("PSD Structure:")
    print_layers(psd)

if __name__ == "__main__":
    inspect_psd_structure()
