import requests
import json

API_BASE = "http://localhost:8000/api"

script = [
    {"id": 1, "speaker": "kanon", "text": "ずんだもん、最近秘密の特訓をしてるって噂、本当？", "emotion": "normal", "action": "thinking", "audio": "t1.wav"},
    {"id": 2, "speaker": "zundamon", "text": "な、なんのことなのだ！？ボクは何もしてないのだ！", "emotion": "panic", "action": "shiver", "audio": "t2.wav"},
    {"id": 3, "speaker": "kanon", "text": "屋根の上から「大ジャンプ」してたのを見たわよ。", "emotion": "happy", "action": "nod", "audio": "t3.wav"},
    {"id": 4, "speaker": "zundamon", "text": "それは...ただのストレッチなのだ！ふんっ！", "emotion": "surprised", "action": "big_jump", "audio": "t4.wav"},
    {"id": 5, "speaker": "kanon", "text": "そのあと「くるくる」回って空に飛んでいかなかった？", "emotion": "happy", "action": "spin", "audio": "t5.wav"},
    {"id": 6, "speaker": "zundamon", "text": "あ、あれはダンスの練習なのだ！ルンルンなのだ！", "emotion": "happy", "action": "happy_hop", "audio": "t6.wav"},
    {"id": 7, "speaker": "kanon", "text": "注目！ずんだもんが嘘をついています！", "emotion": "angry", "action": "zoom_in", "audio": "t7.wav"},
    {"id": 8, "speaker": "zundamon", "text": "ひええ！バレたのだ！お断りなのだー！", "emotion": "panic", "action": "shake_head", "audio": "t8.wav"},
    {"id": 9, "speaker": "kanon", "text": "逃がさないわよ！待ちなさい！", "emotion": "surprised", "action": "run_right", "audio": "t9.wav"},
    {"id": 10, "speaker": "zundamon", "text": "さらばなのだー！バイバイなのだー！", "emotion": "happy", "action": "run_left", "audio": "t10.wav"},
    {"id": 11, "speaker": "kanon", "text": "あ、どこ行くの！？戻ってきなさい！", "emotion": "surprised", "action": "back_off", "audio": "t11.wav"},
    {"id": 12, "speaker": "zundamon", "text": "うわああ！吹っ飛ばされたのだー！", "emotion": "panic", "action": "fly_away", "audio": "t12.wav"},
    {"id": 13, "speaker": "kanon", "text": "あ...星になっちゃった。", "emotion": "sad", "action": "thinking", "audio": "t13.wav"},
    {"id": 14, "speaker": "zundamon", "text": "（遠くから）ボクは負けないのだー！", "emotion": "happy", "action": "jump", "audio": "t14.wav"},
    {"id": 15, "speaker": "kanon", "text": "全く、しょうがないわね。納得いかないわ。", "emotion": "normal", "action": "nod", "audio": "t15.wav"},
    {"id": 16, "speaker": "zundamon", "text": "ガーン...力尽きたのだ...", "emotion": "sad", "action": "fall_down", "audio": "t16.wav"},
    {"id": 17, "speaker": "kanon", "text": "あら、大丈夫？激怒してるかと思ったわ。", "emotion": "surprised", "action": "angry_vibe", "audio": "t17.wav"},
    {"id": 18, "speaker": "zundamon", "text": "うう、寒いのだ...ゾクゾクするのだ。", "emotion": "sad", "action": "shiver", "audio": "t18.wav"},
    {"id": 19, "speaker": "kanon", "text": "もう、変なことばっかりして。次はちゃんと見てなさいよ。", "emotion": "normal", "action": "nod", "audio": "t19.wav"},
    {"id": 20, "speaker": "zundamon", "text": "わーい！次はボクが主役なのだ！", "emotion": "happy", "action": "happy_hop", "audio": "t20.wav"}
]

print("🚀 テスト台本を送信中...")
res = requests.post(f"{API_BASE}/save", json={"scenes": script})
if res.ok:
    print("✅ 動画データの生成が完了しました！")
else:
    print(f"❌ エラーが発生しました: {res.text}")
