from psd_tools import PSDImage

def list_layers(parent, indent=0):
    with open("src/layers.txt", "a", encoding="utf-8") as f:
        for layer in parent:
            f.write("  " * indent + f"{layer.name}\n")
            if hasattr(layer, '__iter__'):
                list_layers(layer, indent + 1)

psd = PSDImage.open(r"C:\Users\narak\Downloads\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3\ずんだもん立ち絵素材2.3.psd")
with open("src/layers.txt", "w", encoding="utf-8") as f:
    f.write("Full Layer List:\n")
list_layers(psd)
