@echo off
echo ==========================================
echo   VisionForge アセットクリーンアップ
echo ==========================================
echo.
echo 現在使用されていない音声ファイルや画像をスキャンしています...
echo.

python src/clean_assets.py

echo.
echo ------------------------------------------
echo 上記のファイルを実際に削除しますか？
echo (削除する場合は [y] を入力して Enter を押してください)
set /p choice="> "

if /i "%choice%"=="y" (
    echo.
    echo 削除を実行中...
    python src/clean_assets.py --force
    echo.
    pause
) else (
    echo.
    echo 削除をキャンセルしました。
    echo.
    pause
)
