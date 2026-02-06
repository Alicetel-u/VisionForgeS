import json
import requests
import asyncio
import uuid
import os
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

def generate_voice(text, speaker_id, filename, speaker_name="kanon"):
    print(f"🎤 音声生成中 ({speaker_name}): {text[:10]}...")
    try:
        # クエリ作成
        res1 = requests.post(f"{VOICEVOX_URL}/audio_query", params={"text": text, "speaker": speaker_id})
        query = res1.json()
        
        # --- 流暢さの調整 ---
        if speaker_name == "kanon":
            query["speedScale"] = 1.15       # ハキハキと速めに
            query["intonationScale"] = 1.2   # 抑揚を豊かに
            query["prePhonemeLength"] = 0.1  # 文頭の無音を詰める
        else:
            query["speedScale"] = 0.95       # ずんだもんは可愛くゆっくりめ
            query["intonationScale"] = 1.0
        
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
async def save_script(data: ScriptUpdate):
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
            
            # テキストが変わっていたら音声を再生成
            if scene.id not in old_texts or scene.text != old_texts[scene.id]:
                speaker_id = SPEAKER_IDS.get(scene.speaker, 10)
                
                # ファイル名がない場合は生成
                if not scene.audio:
                    scene_dict["audio"] = f"audio/{uuid.uuid4()}.wav"
                    # ディレクトリ確認
                    os.makedirs(os.path.join(PUBLIC_DIR, "audio"), exist_ok=True)
                
                duration = generate_voice(scene.text, speaker_id, scene_dict["audio"], scene.speaker)
                scene_dict["duration"] = duration
            else:
                # 変わっていなければ以前の再生時間を維持
                old_scene = next((s for s in old_data if s["id"] == scene.id), None)
                if old_scene:
                    scene_dict["duration"] = old_scene.get("duration", 5.0)
                    # アクションも明示的に指定されていれば引き継ぐ
                    if scene.action != "none":
                        scene_dict["action"] = scene.action
                    else:
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
