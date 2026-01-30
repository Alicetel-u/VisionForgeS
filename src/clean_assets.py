import os
import json
import logging
import fnmatch

# 設定
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR = os.path.join(BASE_DIR, "video", "public")
DATA_FILE = os.path.join(PROJECT_DIR, "cat_data.json")

# ログ設定
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# 絶対に削除しないディレクトリ
PROTECTED_DIRS = [
    "bgm",
    "images/characters",
]

# 絶対に削除しないファイルパターン (glob)
PROTECTED_PATTERNS = [
    "images/bg_*.png",
    "images/bg_*.jpg",
    "images/bg_ending_neon.jpg",
    "images/user_character.png",
    "favicon.ico",
    "logo192.png",
    "logo512.png",
    "manifest.json",
    "robots.txt",
]

def get_used_assets():
    """cat_data.jsonを読み込み、現在使用されているアセットの相対パスリストを返す"""
    if not os.path.exists(DATA_FILE):
        logging.warning(f"データファイルが見つかりません: {DATA_FILE}")
        return set()

    used = set()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        for item in data:
            # 音声、背景画像、個別画像などのフィールドを確認
            for key in ["audio", "bg_image", "image", "bgm"]:
                if key in item and item[key]:
                    # Windowsパスを正規化
                    path = item[key].replace("\\", "/")
                    used.add(path)
    except Exception as e:
        logging.error(f"データファイルの読み込み中にエラーが発生しました: {e}")
    
    return used

def is_protected(rel_path):
    """ファイルが保護対象かどうかを判定する"""
    rel_path = rel_path.replace("\\", "/")
    
    # ディレクトリ保護
    for d in PROTECTED_DIRS:
        if rel_path.startswith(d + "/") or rel_path == d:
            return True
            
    # ファイルパターン保護
    for p in PROTECTED_PATTERNS:
        if fnmatch.fnmatch(rel_path, p):
            return True
            
    return False

def cleanup_assets(dry_run=True):
    """未使用のアセットを特定して削除する"""
    used_assets = get_used_assets()
    all_files = []

    # 全ファイルをスキャン
    for root, dirs, files in os.walk(PROJECT_DIR):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, PROJECT_DIR).replace("\\", "/")
            
            # JSONファイル自体や、出力先フォルダは除外
            if rel_path.endswith(".json") or rel_path.startswith("out/"):
                continue
            
            all_files.append(rel_path)

    to_delete = []
    for f in all_files:
        # 保護ルールに合致するか？
        if is_protected(f):
            continue
            
        # 現在のデータで使用されているか？
        if f in used_assets:
            continue
            
        to_delete.append(f)

    if not to_delete:
        logging.info("未使用のアセットは見つかりませんでした。クリーンです。")
        return

    logging.info(f"--- 未使用アセット一覧 ({len(to_delete)}件) ---")
    for f in to_delete:
        print(f" [DELETE] {f}")

    if dry_run:
        logging.info("\n*** これはプレビューです。実際に削除するには --force オプションを付けて実行してください ***")
    else:
        logging.info(f"\n{len(to_delete)}件のファイルを削除しています...")
        count = 0
        for f in to_delete:
            try:
                os.remove(os.path.join(PROJECT_DIR, f))
                count += 1
            except Exception as e:
                logging.error(f"削除失敗: {f} - {e}")
        logging.info(f"クリーンアップ完了。{count}件のファイルを削除しました。")

if __name__ == "__main__":
    import sys
    # --force が引数にあれば実際に削除
    force_mode = "--force" in sys.argv
    cleanup_assets(dry_run=not force_mode)
