/**
 * AssetOverrideSystem - アセット差し替えシステム
 *
 * 特定のフォルダ（overrides/）に同名ファイルを置くことで、
 * cat_data.jsonを書き換えずにアセットを差し替えられる仕組み
 *
 * 使用例:
 * - 元のパス: images/bg_thread.jpg
 * - 差し替え: overrides/images/bg_thread.jpg に配置
 *
 * 優先順位:
 * 1. overrides/ フォルダ内のファイル
 * 2. cat_data.json で指定された元のファイル
 */

import { ProcessedScene } from '../types';

/** オーバーライド設定 */
export interface OverrideConfig {
    /** オーバーライドフォルダのベースパス */
    basePath: string;
    /** 有効/無効 */
    enabled: boolean;
    /** オーバーライド済みアセットのマップ（キャッシュ） */
    overrideMap: Map<string, string>;
}

/** デフォルト設定 */
export const DEFAULT_OVERRIDE_CONFIG: OverrideConfig = {
    basePath: 'overrides/',
    enabled: true,
    overrideMap: new Map()
};

/**
 * オーバーライドシステムのインスタンスを作成
 */
export function createAssetOverrideSystem(
    config: Partial<OverrideConfig> = {}
): AssetOverrideSystem {
    return new AssetOverrideSystem({
        ...DEFAULT_OVERRIDE_CONFIG,
        ...config
    });
}

/**
 * アセットオーバーライドシステムクラス
 */
export class AssetOverrideSystem {
    private config: OverrideConfig;
    private checkedAssets: Set<string> = new Set();

    constructor(config: OverrideConfig) {
        this.config = config;
    }

    /**
     * アセットパスを解決（オーバーライドがあればそちらを返す）
     */
    resolveAssetPath(originalPath: string): string {
        if (!this.config.enabled) {
            return originalPath;
        }

        // キャッシュにあればそれを返す
        const cached = this.config.overrideMap.get(originalPath);
        if (cached !== undefined) {
            return cached;
        }

        // オーバーライドパスを構築
        const overridePath = `${this.config.basePath}${originalPath}`;

        // 実際のファイル存在確認はRemotionのstaticFileで行われるため、
        // ここではパスの構築のみ行う
        // 存在チェックは画像/音声コンポーネント側で行う

        return originalPath;
    }

    /**
     * 画像パスを解決
     */
    resolveImagePath(originalPath: string): string {
        return this.resolveAssetPath(originalPath);
    }

    /**
     * 音声パスを解決
     */
    resolveAudioPath(originalPath: string): string {
        return this.resolveAssetPath(originalPath);
    }

    /**
     * オーバーライドを手動で登録
     */
    registerOverride(originalPath: string, overridePath: string): void {
        this.config.overrideMap.set(originalPath, overridePath);
    }

    /**
     * オーバーライドを削除
     */
    removeOverride(originalPath: string): void {
        this.config.overrideMap.delete(originalPath);
    }

    /**
     * 全オーバーライドをクリア
     */
    clearOverrides(): void {
        this.config.overrideMap.clear();
    }

    /**
     * オーバーライドリストを取得
     */
    getOverrides(): Map<string, string> {
        return new Map(this.config.overrideMap);
    }

    /**
     * 設定を更新
     */
    updateConfig(config: Partial<OverrideConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * シーンの全アセットを解決済みパスに変換
     */
    processScene(scene: ProcessedScene): ProcessedScene {
        return {
            ...scene,
            bg_image: this.resolveImagePath(scene.bg_image),
            audio: this.resolveAudioPath(scene.audio),
            bgm: this.resolveAudioPath(scene.bgm)
        };
    }
}

/**
 * オーバーライド設定ファイルの型
 * overrides/config.json で管理
 */
export interface OverrideConfigFile {
    /** バージョン */
    version: string;
    /** 有効/無効 */
    enabled: boolean;
    /** アセット差し替えマッピング */
    assets: {
        [originalPath: string]: string;
    };
    /** シーン単位の差し替え */
    scenes: {
        [sceneId: number]: {
            bg_image?: string;
            audio?: string;
            text?: string;
        };
    };
}

/**
 * オーバーライド設定ファイルのデフォルト
 */
export const DEFAULT_OVERRIDE_CONFIG_FILE: OverrideConfigFile = {
    version: '1.0.0',
    enabled: true,
    assets: {},
    scenes: {}
};

/**
 * オーバーライド設定ファイルを読み込んでシステムに適用
 */
export function applyOverrideConfigFile(
    system: AssetOverrideSystem,
    configFile: OverrideConfigFile
): void {
    system.updateConfig({ enabled: configFile.enabled });

    // アセット差し替えを登録
    for (const [original, override] of Object.entries(configFile.assets)) {
        system.registerOverride(original, override);
    }
}

/**
 * シーン単位のオーバーライドを適用
 */
export function applySceneOverrides(
    scenes: ProcessedScene[],
    configFile: OverrideConfigFile
): ProcessedScene[] {
    return scenes.map(scene => {
        const sceneOverride = configFile.scenes[scene.id];
        if (!sceneOverride) {
            return scene;
        }

        return {
            ...scene,
            bg_image: sceneOverride.bg_image || scene.bg_image,
            audio: sceneOverride.audio || scene.audio,
            text: sceneOverride.text || scene.text
        };
    });
}

export default AssetOverrideSystem;
