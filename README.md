# VisionForge

ゲームニュース動画を自動生成するプロジェクトです。

## 📋 概要

RSSフィードからゲームニュースを取得し、以下を自動で生成します：
- 📰 **ニューステキスト**（4gamer.netから取得）
- 🎙️ **音声ナレーション**（Google Text-to-Speech）
- 🖼️ **関連画像**（Pexels API）
- 🎬 **1分間の動画**（Remotion + タイピングアニメーション）

---

## 🚀 セットアップ手順

### 1. 必要なソフトウェア
- **Python 3.8以上**
- **Node.js 16以上**

### 2. Pythonパッケージのインストール
```bash
# 仮想環境を作成（推奨）
python -m venv venv

# 仮想環境を有効化
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 必要なパッケージをインストール
pip install -r requirements.txt
```

### 3. Remotion（動画生成）のセットアップ
```bash
cd video
npm install
```

### 4. Pexels API キーの取得（必須）

**無料で5分で完了します！**

1. **Pexels公式サイト**にアクセス  
   👉 https://www.pexels.com/

2. **アカウント作成**（メールアドレスだけでOK）  
   - 右上の「Sign up」をクリック
   - メールアドレスとパスワードを入力

3. **API登録ページ**にアクセス  
   👉 https://www.pexels.com/api/

4. **「Get Started」をクリック**  
   - アプリ名を入力（例: `VisionForge`）
   - 利用規約に同意

5. **APIキーをコピー**  
   - 画面に表示される長い文字列（例: `abc123XYZ...`）をコピー

6. **`.env`ファイルに設定**  
   ```bash
   # プロジェクトのルートディレクトリ（VisionForge/）に移動
   ```
   
   `.env`ファイルを開いて、以下のように編集：
   ```env
   PEXELS_API_KEY=ここにコピーしたAPIキーを貼り付け
   ```

**制限:**
- 無料プラン: 5000リクエスト/月（1日10本動画を作っても余裕！）

---

## 💡 使い方

### ステップ1: ニュースデータを生成
```bash
# Pythonスクリプトを実行
python src/news_processor.py
```

**実行内容:**
- 4gamer.netから最新ニュースを取得
- 音声ファイル（MP3）を生成
- 関連画像をPexels APIで取得
- `video/public/news_data.json` にデータを保存

### ステップ2: 動画をプレビュー
```bash
cd video
npm start
```

ブラウザで `http://localhost:3000` が開き、動画プレビューが表示されます。

### ステップ3: 動画をレンダリング
```bash
npm run build
```

完成した動画が `video/out/video.mp4` に保存されます！

---

## 📁 プロジェクト構成

```
VisionForge/
├── src/
│   ├── news_processor.py      # ニュース取得＆音声・画像生成
│   ├── main.py                 # その他のメインスクリプト
│   └── create_test_assets.py  # テスト用アセット生成
├── video/
│   ├── src/
│   │   ├── Video.tsx           # Remotion動画設定
│   │   ├── HelloWorld.tsx      # 動画コンポーネント
│   │   └── index.ts            # エントリーポイント
│   ├── public/
│   │   ├── audio/              # 生成された音声ファイル
│   │   ├── images/             # 取得された画像
│   │   ├── bgm.mp3             # 背景音楽
│   │   └── news_data.json      # ニュースデータ
│   └── package.json
├── requirements.txt            # Python依存パッケージ
├── .env                        # API設定（Gitにコミットしない）
└── README.md
```

---

## 🎨 カスタマイズ

### ニュース取得数を変更
`src/news_processor.py` の15行目を編集：
```python
for entry in feed.entries[:1]:  # [:1] を [:3] にすると3件取得
```

### 動画の長さを変更
`video/src/HelloWorld.tsx` の29行目を編集：
```typescript
const durationPerItem = 450; // 450フレーム = 15秒（30fps）
```

### 画像検索キーワードを変更
`src/news_processor.py` の104行目を編集：
```python
search_query = "video game gaming"  # 好きなキーワードに変更
```

---

## ⚠️ トラブルシューティング

### `PEXELS_API_KEYが設定されていません`
- `.env`ファイルが存在するか確認
- APIキーが正しく貼り付けられているか確認
- `.env.example`を参考にフォーマットを確認

### 画像が取得できない
- インターネット接続を確認
- Pexels APIの制限（5000リクエスト/月）を超えていないか確認

### 音声が生成されない
- `gTTS`パッケージがインストールされているか確認: `pip install gTTS`

---

## 📝 ライセンス

このプロジェクトは個人利用・商用利用ともに自由です。  
Pexelsの画像を使用する場合は、可能であればクレジット表記を推奨します。

---

## 🙏 謝辞

- **4gamer.net** - ゲームニュースRSS提供
- **Pexels** - 高品質な無料画像
- **Remotion** - 動画生成フレームワーク
- **Google TTS** - 音声合成
