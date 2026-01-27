import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("PEXELS_API_KEY")
headers = {"Authorization": api_key}
params = {"query": "munchkin cat short legs", "per_page": 1, "orientation": "landscape"}

response = requests.get("https://api.pexels.com/v1/search", headers=headers, params=params, timeout=15)
data = response.json()

if data["photos"]:
    img_url = data["photos"][0]["src"]["large"]
    img_data = requests.get(img_url).content
    
    output_path = os.path.join(os.path.dirname(__file__), "..", "video", "public", "images", "cat_munchkin.jpg")
    with open(output_path, "wb") as f:
        f.write(img_data)
    print(f"✓ マンチカンの画像をダウンロードしました: {output_path}")
else:
    print("画像が見つかりませんでした")
