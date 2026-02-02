# VisionForge 動画生成テンプレート

このドキュメントは、VisionForgeプロジェクトで動画を生成する際の標準テンプレートです。

## 1. プロジェクト構造

```
VisionForge/
├── src/                          # Python スクリプト（動画データ生成）
│   ├── mh_suumo_video.py         # 参考：MH×SUUMOコラボ動画生成スクリプト
│   ├── generate_ending.py        # エンディングシーン生成
│   └── regenerate_audio.py       # 音声再生成ユーティリティ
├── video/                        # Remotion プロジェクト
│   ├── public/
│   │   ├── cat_data.json         # シーンデータ（メイン）
│   │   ├── audio/                # 音声ファイル (.wav)
│   │   ├── images/               # 背景画像・キャラクター
│   │   │   └── characters/       # キャラクター立ち絵
│   │   │       ├── zundamon/     # ずんだもん（カスタム版）
│   │   │       └── kanon/        # かのん
│   │   └── bgm/                  # BGMファイル
│   └── src/                      # React/Remotion コンポーネント
└── assets/
    └── source/                   # PSD等の元素材
```

## 2. シーンデータ形式（cat_data.json）

各シーンは以下の形式で定義します：

```json
{
  "id": 1,
  "speaker": "zundamon | kanon | system",
  "emotion": "normal | happy | angry | sad | surprised | impressed | panic",
  "action": "none | nod | happy_hop | thinking | shiver | jump | wave",
  "text": "セリフテキスト",
  "title": "シーンタイトル（タイトルバナーに表示）",
  "audio": "audio/xxx.wav",
  "bg_image": "images/bg_xxx.jpg",
  "duration": 7.5,
  "direction": {
    "mood": "happy | normal | sad",
    "importance": "normal | climax",
    "isTopicChange": true | false,
    "section": "main | ending | ending_fixed"
  },
  "telop": {
    "emphasisWords": ["強調ワード1", "強調ワード2"]
  },
  "camera": {
    "preset": "center | zoom_in"
  },
  "bgm": "bgm/xxx.mp3"
}
```

### フィールド説明

| フィールド | 説明 |
|-----------|------|
| `id` | シーンの連番ID |
| `speaker` | 話者（zundamon, kanon, system） |
| `emotion` | キャラクターの表情 |
| `action` | キャラクターのアクション |
| `text` | セリフテキスト（字幕に表示） |
| `title` | タイトルバナーに表示するテキスト |
| `audio` | 音声ファイルのパス |
| `bg_image` | 背景画像のパス |
| `duration` | シーンの長さ（秒）= 音声長 + 0.5秒 |
| `direction.isTopicChange` | trueでタイトルバナーを更新 |
| `direction.section` | main/ending/ending_fixed |
| `telop.emphasisWords` | 強調する単語リスト |
| `bgm` | BGM開始時のみ指定 |

## 3. キャラクター設定

| キャラクター | speaker_id (VOICEVOX) | 表情ファイル | 備考 |
|------------|----------------------|------------|------|
| ずんだもん | 3 | `characters/zundamon/{emotion}.png` | カスタム版使用 |
| **かのん** | 10 (雨晴はう) | `characters/kanon/{emotion}.png` | **名前は「かのん」** |

### 表情バリエーション

各キャラクターには以下の表情があります：
- `normal` / `normal_close` / `normal_open`
- `happy` / `happy_close` / `happy_open`
- `angry` / `angry_close` / `angry_open`
- `sad` / `sad_close` / `sad_open`
- `surprised` / `surprised_close` / `surprised_open`
- `impressed` / `impressed_close` / `impressed_open`
- `panic` / `panic_close` / `panic_open`

`_close` は目閉じ、`_open` は口開き（リップシンク用）

## 4. 動画生成フロー

```
1. 台本作成
   ↓
2. Pythonスクリプトでシーンデータ生成
   ↓
3. VOICEVOX起動 → 音声生成 (.wav)
   ↓
4. cat_data.json 出力
   - duration = 音声ファイル長 + 0.5秒
   ↓
5. プレビュー確認
   - cd video && npm run start
   - http://localhost:3000 で確認
   ↓
6. エクスポート
   - npm run build:fast (HD 1280x720, 24fps)
```

## 5. エクスポート設定

| コマンド | 解像度 | FPS | 用途 |
|---------|--------|-----|------|
| `npm run build` | 1920×1080 | 30 | 本番用（高品質） |
| `npm run build:fast` | 1280×720 | 24 | 確認用・軽量版 |
| `npm run build:ultra` | 854×480 | 20 | テスト用（非推奨） |

## 6. 重要なルール

### 必須ルール

1. **音声生成時のduration設定**
   - `duration = 音声ファイル長 + 0.5秒`
   - これによりセリフの最後が切れることを防止

2. **ずんだもん立ち絵**
   - カスタム版を使用（クロード調整済み）
   - 元素材: `assets/source/ずんだもん立ち絵素材2.3.psd`

3. **かのんの名前**
   - 台本・セリフでは必ず「**かのん**」と呼ぶ
   - 「るしいど」は使用しない

4. **エンディング**
   - `ending_fixed` セクションで固定シーンを使用
   - 固定のエンディングセリフあり

5. **タイトルバナー**
   - `isTopicChange: true` で新タイトル表示
   - `speaker: "system"` でタイトル専用シーン作成

### 音声生成の注意点

- VOICEVOXが起動していることを確認
- speedScale: 1.2 で少し早めに設定
- 読み調整が必要な単語は事前に変換（例: SUUMO → スーモ）

## 7. 参考スクリプト

- `src/mh_suumo_video.py` - MH×SUUMOコラボ動画（完成版）
- `src/generate_ending.py` - エンディング生成
- `src/regenerate_audio.py` - 音声再生成ユーティリティ
