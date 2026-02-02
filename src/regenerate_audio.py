#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
音声再生成スクリプト
指定されたセリフでVOICEVOXを使って音声を再生成し、cat_data.jsonのdurationも更新します。
"""

import requests
import json
import wave
import contextlib

VOICEVOX_URL = "http://127.0.0.1:50021"

def get_audio_duration(file_path):
    """wavファイルの長さを秒単位で取得します。"""
    try:
        with contextlib.closing(wave.open(file_path, 'r')) as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            duration = frames / float(rate)
            return duration
    except Exception as e:
        print(f"エラー: 音声ファイル読み取り失敗: {e}")
        return None

def generate_voice(text, output_path, speaker_id=3):
    """VOICEVOX APIを使用して音声を生成します。"""
    try:
        # 読み調整
        text = text.replace("SUUMO", "スーモ").replace("ＳＵＵＭＯ", "スーモ")
        text = text.replace("ネルギガンテ", "ねるぎがんて")
        
        print(f"生成中: {text[:30]}...")
        
        query_payload = {"text": text, "speaker": speaker_id}
        query_response = requests.post(f"{VOICEVOX_URL}/audio_query", params=query_payload, timeout=20)
        if query_response.status_code != 200: 
            print(f"エラー: audio_query失敗 (status: {query_response.status_code})")
            return False
            
        query_data = query_response.json()
        query_data["speedScale"] = 1.2

        synthesis_response = requests.post(
            f"{VOICEVOX_URL}/synthesis",
            params={"speaker": speaker_id},
            json=query_data,
            timeout=60
        )

        if synthesis_response.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(synthesis_response.content)
            print(f"成功: {output_path}")
            return True
        else:
            print(f"エラー: synthesis失敗 (status: {synthesis_response.status_code})")
    except Exception as e:
        print(f"エラー: {e}")
    return False

def update_cat_data_duration(scene_id, new_duration, cat_data_path="video/public/cat_data.json"):
    """cat_data.jsonの指定されたシーンのdurationを更新します。"""
    try:
        with open(cat_data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        for scene in data:
            if scene.get("id") == scene_id:
                old_duration = scene.get("duration", 0)
                scene["duration"] = new_duration
                print(f"Duration更新: ID {scene_id}: {old_duration:.2f}秒 -> {new_duration:.2f}秒")
                break
        
        with open(cat_data_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return True
    except Exception as e:
        print(f"エラー: cat_data.json更新失敗: {e}")
        return False

if __name__ == "__main__":
    # 設定
    scene_id = 27  # 更新対象のシーンID
    text = "ワイルズを遊び尽くすために、ボクも防音室付きの新居を検討するのだ！みんなはどのモンスターのこだわり条件に共感したのだ？"
    output_path = "video/public/audio/mh_suumo_16.wav"
    buffer_seconds = 0.5  # 余白（セリフ切れ防止）
    
    print("=" * 50)
    print("音声再生成スクリプト")
    print("=" * 50)
    print(f"シーンID: {scene_id}")
    print(f"セリフ: {text}")
    print(f"出力先: {output_path}")
    print(f"話者: ずんだもん (ID: 3)")
    print(f"余白: {buffer_seconds}秒")
    print("=" * 50)
    
    # 音声生成
    success = generate_voice(text, output_path, speaker_id=3)
    
    if success:
        # 音声ファイルの長さを取得
        audio_duration = get_audio_duration(output_path)
        if audio_duration:
            # 余白を追加したdurationでcat_data.jsonを更新
            new_duration = audio_duration + buffer_seconds
            print(f"音声長: {audio_duration:.2f}秒 + 余白{buffer_seconds}秒 = {new_duration:.2f}秒")
            update_cat_data_duration(scene_id, new_duration)
            print("\n[OK] 音声再生成とduration更新が完了しました！")
        else:
            print("\n[NG] 音声ファイルの長さを取得できませんでした。")
    else:
        print("\n[NG] 音声再生成に失敗しました。VOICEVOXが起動しているか確認してください。")
