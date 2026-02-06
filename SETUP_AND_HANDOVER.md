# 環境構築・作業引継ぎガイド

このプロジェクトを新しいPC（または他の環境）でセットアップし、作業を再開するための手順です。

## 1. プロジェクトの取得と依存関係のインストール

ターミナルを開き、以下のコマンドを順番に実行してください。

```powershell
# 1. コードの取得
git clone https://github.com/Alicetel-u/VisionForgeS.git
cd VisionForgeS

# 2. 依存関係のインストール
npm install
```

## 2. Remotion Skill のインストール（重要・未完了）

AIエージェント（Antigravity）に動画制作の詳細な知識を与えるため、以下の手順でSkillをインストールしてください。
**※この設定はPCごとに毎回行う必要があります。自動同期されません。**

1.  ターミナルで以下のコマンドを実行（PowerShell用）:
    ```powershell
    cmd /c "npx skills add remotion-dev/skills"
    ```

2.  対話的なセットアップが表示されるので、以下のように回答します:
    *   `Need to install the following packages: skills@... Ok to proceed? (y)`
        *   👉 **y** と入力して Enter
    *   `Select agents to install skills to`
        *   👉 矢印キーで **Antigravity** を選び、スペースキーでチェックを入れて Enter
    *   `Installation scope`
        *   👉 **Project** を選択して Enter
    *   `Installation method`
        *   👉 **Symlink** を選択して Enter
    *   `Proceed with installation?`
        *   👉 **Yes** を選択して Enter

## 3. 動作確認

インストールが完了したら、以下のコマンドでプレビューサーバーを起動して動作確認します。

```powershell
npm start
```

ブラウザが開いて動画（かのんちゃん登場シーンなど）が再生されれば準備完了です！
