import os
import json
import sys

def fix_image_data():
    """
    特定の不適切な画像を別の画像に強制的に置き換える修正システム
    """
    # プロジェクトのルートディレクトリを取得
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    CAT_DATA_PATH = os.path.join(BASE_DIR, "video", "public", "cat_data.json")

    # 修正対象の設定
    # キー: 削除したい画像名の一部
    # 値: 置き換え先の画像パス
    FIX_RULES = {
        "uploaded_media_1769744824946.png": "images/bg_mh_vibe.jpg",
        "uploaded_media_1769745535670.png": "images/bg_mh_vibe.jpg"
    }

    if not os.path.exists(CAT_DATA_PATH):
        print(f"[ERROR] {CAT_DATA_PATH} が見つかりません。")
        return

    try:
        with open(CAT_DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)

        modified = False
        for item in data:
            # bg_image または image フィールドをチェック
            for field in ["bg_image", "image"]:
                if field in item and item[field]:
                    for bad_img, good_img in FIX_RULES.items():
                        if bad_img in item[field]:
                            print(f"[FIX] シーン {item.get('id')} の画像を修正: {item[field]} -> {good_img}")
                            item[field] = good_img
                            modified = True

        if modified:
            with open(CAT_DATA_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print("[SUCCESS] 画像データの修正が完了しました。")
        else:
            print("[INFO] 修正が必要な箇所は見つかりませんでした。")

    except Exception as e:
        print(f"[ERROR] 修正中にエラーが発生しました: {e}")

if __name__ == "__main__":
    fix_image_data()
