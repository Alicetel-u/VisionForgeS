import os
import json
import requests
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

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
    "kanon": 10,
    "zundamon": 3
}

class Scene(BaseModel):
    id: int
    speaker: str
    text: str
    emotion: str
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

def generate_voice(text, speaker_id, filename):
    print(f"🎤 音声生成中: {text[:10]}...")
    try:
        # クエリ作成
        res1 = requests.post(f"{VOICEVOX_URL}/audio_query", params={"text": text, "speaker": speaker_id})
        query = res1.json()
        query["speedScale"] = 0.95 # 少しゆっくりめ
        
        # 音声合成
        res2 = requests.post(f"{VOICEVOX_URL}/synthesis", params={"speaker": speaker_id}, json=query)
        
        output_path = os.path.join(PUBLIC_DIR, filename)
        with open(output_path, "wb") as f:
            f.write(res2.content)
            
        # 実際のファイルから長さを取得し、0.5秒足す
        return get_audio_duration(output_path) + 0.5
    except Exception as e:
        print(f"❌ 音声生成エラー: {e}")
        return 5.0

@app.get("/api/script")
async def get_script():
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save")
async def save_script(data: ScriptUpdate):
    try:
        # 1. 既存のデータと比較して、テキストが変わったシーンだけ音声を再生成
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            old_data = json.load(f)
        
        old_texts = {s["id"]: s["text"] for s in old_data}
        
        new_scenes = []
        for scene in data.scenes:
            scene_dict = scene.dict()
            
            # テキストが変わっていたら音声を再生成
            if scene.id not in old_texts or scene.text != old_texts[scene.id]:
                speaker_id = SPEAKER_IDS.get(scene.speaker, 10)
                duration = generate_voice(scene.text, speaker_id, scene.audio)
                scene_dict["duration"] = duration
            else:
                # 変わっていなければ以前の再生時間を維持
                old_scene = next((s for s in old_data if s["id"] == scene.id), None)
                if old_scene:
                    scene_dict["duration"] = old_scene.get("duration", 5.0)
            
            new_scenes.append(scene_dict)

        # 2. JSONを保存
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(new_scenes, f, ensure_ascii=False, indent=2)
            
        return {"status": "success", "message": "保存と音声生成が完了しました"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
