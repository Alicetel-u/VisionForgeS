import { Config } from '@remotion/cli/config';

// プレビュー時は低解像度・低フレームレートで表示
Config.overrideWebpackConfig((config) => {
    return config;
});

// プレビュー時の設定
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
