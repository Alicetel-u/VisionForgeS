import json
import requests
import asyncio
import uuid
import os
import subprocess
import base64
import re
import threading
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

app = FastAPI(title="VisionForge Studio Backend")

# CORS設定 (ブラウザからのアクセスを許可)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# パス設定
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(BASE_DIR, "video", "public", "cat_data.json")
PUBLIC_DIR = os.path.join(BASE_DIR, "video", "public")
VOICEVOX_URL = "http://127.0.0.1:50021"

SPEAKER_IDS = {
    "metan": 2,
    "zunda": 3,
    "kanon": 10
}

VIDEO_DIR = os.path.join(BASE_DIR, "video")
OUTPUT_DIR = os.path.join(VIDEO_DIR, "out")

# Render state management
render_state: Dict[str, Any] = {
    "status": "idle",  # idle | rendering | done | error
    "progress": 0,
    "error": None,
}

class Scene(BaseModel):
    id: int
    speaker: str
    text: str
    emotion: str
    action: Optional[str] = "none"
    audio: str
    image: Optional[str] = None
    duration: Optional[float] = None

class ScriptUpdate(BaseModel):
    scenes: List[Scene]

import wave
import contextlib

def get_audio_duration(file_path):
    try:
        if not os.path.exists(file_path): return 5.0
        with contextlib.closing(wave.open(file_path,'r')) as f:
            frames = f.getnframes()
            rate = f.getframerate()
            return frames / float(rate)
    except:
        return 5.0

def generate_voice(text, speaker_id, filename, speaker_name="kanon", speed_scale=1.0):
    print(f"🎤 音声生成中 ({speaker_name}, speed={speed_scale}): {text[:10]}...")
    try:
        # クエリ作成
        res1 = requests.post(f"{VOICEVOX_URL}/audio_query", params={"text": text, "speaker": speaker_id})
        query = res1.json()

        # --- 流暢さの調整 ---
        if speaker_name == "kanon":
            base_speed = 1.15       # ハキハキと速めに
            query["intonationScale"] = 1.2   # 抑揚を豊かに
            query["prePhonemeLength"] = 0.1  # 文頭の無音を詰める
        else:
            base_speed = 0.95       # ずんだもんは可愛くゆっくりめ
            query["intonationScale"] = 1.0

        # ユーザー指定の速度倍率を適用
        query["speedScale"] = base_speed * speed_scale
        
        # 音声合成
        res2 = requests.post(f"{VOICEVOX_URL}/synthesis", params={"speaker": speaker_id}, json=query)
        
        output_path = os.path.join(PUBLIC_DIR, filename)
        with open(output_path, "wb") as f:
            f.write(res2.content)
            
        # 実際のファイルから長さを取得し、少し余裕を持たせる
        return get_audio_duration(output_path) + 0.3
    except Exception as e:
        print(f"❌ 音声生成エラー: {e}")
        return 5.0

def infer_action(text: str) -> str:
    """セリフの内容からアクションを推論する"""
    keywords = {
        "fly_away": ["うわあ", "わああ", "吹っ飛", "飛ばさ", "助けて", "ぎゃあ", "きゃあ"],
        "run_left": ["逃げろ", "さらば", "バイバイ", "走れ", "逃げる"],
        "run_right": ["あっちいけ", "行け", "急げ"],
        "jump": ["ジャンプ", "跳ぶ", "やった", "うれしい", "わーい"],
        "big_jump": ["大ジャンプ", "高く跳ぶ", "すごい"],
        "nod": ["うん", "はい", "そうですね", "納得", "了解", "なるほど", "承知"],
        "shake_head": ["ダメ", "違う", "無理", "嫌だ", "そんな", "いやだ", "お断り"],
        "shiver": ["怖い", "寒い", "震える", "ゾクゾク", "ひえっ"],
        "spin": ["回転", "回る", "くるくる", "ダンス"],
        "zoom_in": ["注目", "見て", "ドアップ", "ここからです"],
        "back_off": ["やめて", "近寄るな", "引くわ", "ドン引き"],
        "angry_vibe": ["激怒", "許さん", "ぶっ飛ばす", "怒った"],
        "happy_hop": ["ルンルン", "楽しい", "わくわく"],
        "fall_down": ["ガーン", "絶望", "力尽きた", "無理です"],
        "thinking": ["うーん", "考え中", "どうしよう", "かな？"]
    }
    
    for action, words in keywords.items():
        if any(word in text for word in words):
            return action
    return "none"

@app.get("/api/script")
async def get_script():
    try:
        if not os.path.exists(JSON_PATH):
            return []
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save")
async def save_script(data: ScriptUpdate, generate_audio: bool = True, speed_scale: float = 1.0):
    try:
        # 1. 既存のデータと比較して、テキストが変わったシーンだけ音声を再生成
        old_data = []
        if os.path.exists(JSON_PATH):
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                old_data = json.load(f)
        
        old_texts = {s["id"]: s["text"] for s in old_data}
        
        new_scenes = []
        for scene in data.scenes:
            scene_dict = scene.dict()
            
            # アクションが未指定、またはテキストが変わっていたら推論
            if scene.action == "none" or (scene.id in old_texts and scene.text != old_texts[scene.id]):
                scene_dict["action"] = infer_action(scene.text)
            
            # ファイル名がない場合は生成（パスだけは確保しておく）
            if not scene.audio:
                scene_dict["audio"] = f"audio/{uuid.uuid4()}.wav"
                scene_dict["duration"] = 5.0 # デフォルト
            
            # ディレクトリ確認
            if generate_audio:
                os.makedirs(os.path.join(PUBLIC_DIR, "audio"), exist_ok=True)

            # 音声生成が必要か判定
            needs_update = scene.id not in old_texts or scene.text != old_texts[scene.id]
            file_exists = os.path.exists(os.path.join(PUBLIC_DIR, scene_dict["audio"]))

            if generate_audio and (needs_update or not file_exists):
                speaker_id = SPEAKER_IDS.get(scene.speaker, 10)
                duration = generate_voice(scene.text, speaker_id, scene_dict["audio"], scene.speaker, speed_scale)
                scene_dict["duration"] = duration
            elif not generate_audio and needs_update:
                 # 音声生成せず保存だけする場合でも、durationは仮で維持するか更新しない
                 pass
            elif not needs_update:
                # 変わっていなければ以前の再生時間を維持
                old_scene = next((s for s in old_data if s["id"] == scene.id), None)
                if old_scene:
                    scene_dict["duration"] = old_scene.get("duration", 5.0)
                    if scene.action == "none": # 明示的に変えてない場合のみ継承
                         scene_dict["action"] = old_scene.get("action", "none")
            
            new_scenes.append(scene_dict)

        # 2. JSONを保存
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(new_scenes, f, ensure_ascii=False, indent=2)
            
        return {"status": "success", "message": "保存と音声生成、アクション推論が完了しました"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import File, UploadFile
import shutil

@app.post("/api/upload_image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # ディレクトリ確認
        upload_dir = os.path.join(PUBLIC_DIR, "images")
        os.makedirs(upload_dir, exist_ok=True)
        
        # 安全なファイル名を生成
        file_extension = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4()}{file_extension}"
        file_location = os.path.join(upload_dir, new_filename)
        
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        return {"status": "success", "url": f"images/{new_filename}"}
    except Exception as e:
        print(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Render API - 動画エクスポート
# ============================================================

class RenderRequest(BaseModel):
    blocks: List[dict]
    imageSpans: Optional[List[dict]] = []

def extract_and_save_images(blocks: List[dict]) -> List[dict]:
    """base64画像をファイルに保存し、パスに置換する"""
    render_img_dir = os.path.join(PUBLIC_DIR, "images", "render")
    os.makedirs(render_img_dir, exist_ok=True)

    updated_blocks = []
    for block in blocks:
        block = dict(block)

        # Handle legacy single image
        if block.get("image") and block["image"].startswith("data:"):
            filename = save_base64_image(block["image"], render_img_dir)
            block["image"] = f"images/render/{filename}"

        # Handle images array
        if block.get("images"):
            updated_images = []
            for layer in block["images"]:
                layer = dict(layer)
                if layer.get("src") and layer["src"].startswith("data:"):
                    filename = save_base64_image(layer["src"], render_img_dir)
                    layer["src"] = f"images/render/{filename}"
                updated_images.append(layer)
            block["images"] = updated_images

        updated_blocks.append(block)
    return updated_blocks

def save_base64_image(data_url: str, output_dir: str) -> str:
    """data:URL からファイルに保存し、ファイル名を返す"""
    match = re.match(r'data:image/(\w+);base64,(.+)', data_url, re.DOTALL)
    if not match:
        # fallback: assume png
        img_data = data_url.split(",", 1)[-1] if "," in data_url else data_url
        ext = "png"
    else:
        ext = match.group(1)
        img_data = match.group(2)

    if ext == "jpeg":
        ext = "jpg"

    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(output_dir, filename)
    with open(filepath, "wb") as f:
        f.write(base64.b64decode(img_data))
    return filename

def run_render(props_path: str, output_path: str):
    """Remotion レンダリングをバックグラウンドで実行"""
    global render_state
    render_state = {"status": "rendering", "progress": 0, "error": None}

    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        cmd = [
            "npx", "remotion", "render",
            "src/index.ts", "EditorExport",
            output_path,
            f"--props={props_path}",
            "--log=verbose",
        ]
        print(f"[Render] Starting: {' '.join(cmd)}")

        process = subprocess.Popen(
            cmd,
            cwd=VIDEO_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=True,
        )

        for line in iter(process.stdout.readline, ""):
            line = line.strip()
            if not line:
                continue
            print(f"[Render] {line}")

            # Parse progress from Remotion output (e.g., "Rendering frame 30/300 (10%)")
            progress_match = re.search(r'(\d+)%', line)
            if progress_match:
                render_state["progress"] = int(progress_match.group(1))

            # Also detect "x/y" frame patterns
            frame_match = re.search(r'(\d+)/(\d+)', line)
            if frame_match:
                current = int(frame_match.group(1))
                total = int(frame_match.group(2))
                if total > 0:
                    render_state["progress"] = min(99, int(current / total * 100))

        process.wait()

        if process.returncode == 0 and os.path.exists(output_path):
            render_state = {"status": "done", "progress": 100, "error": None}
            print(f"[Render] Complete: {output_path}")
        else:
            render_state = {
                "status": "error",
                "progress": render_state.get("progress", 0),
                "error": f"Render failed with exit code {process.returncode}",
            }
            print(f"[Render] Failed with code {process.returncode}")

    except Exception as e:
        render_state = {"status": "error", "progress": 0, "error": str(e)}
        print(f"[Render] Error: {e}")

@app.post("/api/render")
async def start_render(data: RenderRequest):
    global render_state

    if render_state.get("status") == "rendering":
        raise HTTPException(status_code=409, detail="Render already in progress")

    try:
        # 1. Extract and save base64 images to files
        updated_blocks = extract_and_save_images(data.blocks)

        # 2. Save props JSON
        props = {
            "blocks": updated_blocks,
            "imageSpans": data.imageSpans or [],
        }
        props_path = os.path.join(VIDEO_DIR, "render_props.json")
        with open(props_path, "w", encoding="utf-8") as f:
            json.dump(props, f, ensure_ascii=False)

        # 3. Start render in background thread
        output_path = os.path.join(OUTPUT_DIR, "export.mp4")
        thread = threading.Thread(
            target=run_render,
            args=(props_path, output_path),
            daemon=True,
        )
        thread.start()

        return {"status": "started"}

    except Exception as e:
        print(f"[Render] Start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/render/status")
async def get_render_status():
    return render_state

@app.get("/api/render/download")
async def download_render():
    output_path = os.path.join(OUTPUT_DIR, "export.mp4")
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Export file not found")
    return FileResponse(
        output_path,
        media_type="video/mp4",
        filename="visionforge_export.mp4",
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
