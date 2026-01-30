/**
 * VisionForge 型定義ファイル
 * 全コンポーネントで共有する型を集約
 *
 * 【LLM生成対応】
 * Python側でcat_data.jsonを生成する際は、以下のフィールドを参照してください。
 * 全てのフィールドにはデフォルト値があり、省略可能です。
 */

import { Emotion, Action } from '../AnimeCharacter';

// ========================================
// 基本型定義
// ========================================

/** 話者タイプ */
export type Speaker = 'metan' | 'zundamon' | 'kanon';

/** シーンタイプ */
export type SceneType = 'narration' | 'comment' | 'ending' | 'intro' | 'transition_only';

/**
 * トランジションタイプ
 * シーン切り替え時の演出を指定
 */
export type TransitionType =
    | 'none'           // トランジションなし
    | 'fade'           // フェードイン/アウト
    | 'wipe_left'      // 左方向ワイプ
    | 'wipe_right'     // 右方向ワイプ
    | 'wipe_up'        // 上方向ワイプ
    | 'wipe_down'      // 下方向ワイプ
    | 'logo'           // ロゴ付きトランジション（トピック切り替え用）
    | 'flash'          // フラッシュ（衝撃的な場面転換）
    | 'zoom'           // ズームトランジション
    | 'dissolve';      // ディゾルブ（柔らかい切り替え）

/**
 * カメラプリセット
 * 簡易指定用のプリセット名
 */
export type CameraPreset =
    | 'static'         // 固定カメラ
    | 'wide'           // ワイドショット
    | 'closeup'        // クローズアップ
    | 'focus_left'     // 左側（カノン）フォーカス
    | 'focus_right'    // 右側（ずんだもん）フォーカス
    | 'dramatic'       // ドラマチックズーム
    | 'pan_left'       // 左パン
    | 'pan_right'      // 右パン
    | 'slow_zoom';     // ゆっくりズーム

/**
 * カメラ設定
 * 詳細なカメラワークを指定
 */
export interface CameraSettings {
    zoom: number;              // ズーム倍率 (0.8 ~ 1.5, デフォルト: 1.0)
    panX: number;              // 水平パン (-1.0 ~ 1.0, デフォルト: 0)
    panY: number;              // 垂直パン (-1.0 ~ 1.0, デフォルト: 0)
    duration?: number;         // アニメーション時間（秒）
    preset?: CameraPreset;     // プリセット指定（詳細設定より優先）
}

/**
 * VFX設定
 * 視覚エフェクトを指定
 */
export interface VFXSettings {
    shake?: number;                    // シェイク強度 (0-10)
    flash?: boolean;                   // フラッシュ発動
    concentrationLines?: boolean;      // 集中線
    speedLines?: boolean;              // スピード線
    speedLinesDirection?: 'horizontal' | 'vertical';
    vignette?: boolean;                // ビネット効果
    colorOverlay?: string;             // カラーオーバーレイ (例: "rgba(255,0,0,0.3)")
    blur?: number;                     // ブラー強度 (0-10)
}

/**
 * トランジション設定
 * 詳細なトランジション制御
 */
export interface TransitionSettings {
    type: TransitionType;
    duration?: number;         // トランジション時間（フレーム数、デフォルト: 18）
    color?: string;            // ワイプ色など
    logoText?: string;         // ロゴトランジション時のテキスト
    direction?: 'in' | 'out';  // ズームトランジションの方向
}

/**
 * テロップ設定
 * 強調表示や特殊テロップの制御
 */
export interface TelopSettings {
    emphasisWords?: string[];          // 強調表示するワード
    emphasisColor?: string;            // 強調色（デフォルト: #ff3b30）
    showTicker?: boolean;              // ニュースティッカー表示
    tickerText?: string;               // ティッカーテキスト
    titleOverride?: string;            // タイトルの一時的な上書き
    hideTitle?: boolean;               // タイトル非表示
    hideDialogBox?: boolean;           // セリフボックス非表示
}

/**
 * 演出指示
 * LLMが生成する高レベルな演出ヒント
 */
export interface DirectionHints {
    mood?: 'calm' | 'excited' | 'tense' | 'funny' | 'sad' | 'dramatic';
    pacing?: 'slow' | 'normal' | 'fast';
    importance?: 'low' | 'normal' | 'high' | 'climax';
    isTopicChange?: boolean;           // トピック変更（ロゴトランジション推奨）
    isReaction?: boolean;              // リアクションシーン
    isCutaway?: boolean;               // カットアウェイ（画像挿入シーン）
}

// ========================================
// データ構造
// ========================================

/**
 * JSONから読み込む生データ
 * Python側でこの形式のJSONを生成してください
 */
export interface ThreadItem {
    // === 必須フィールド ===
    id: number;                        // シーンID（1から連番）
    audio: string;                     // 音声ファイルパス (例: "audio/scene_0.wav")

    // === 基本フィールド ===
    speaker?: Speaker;                 // 話者 (デフォルト: "kanon")
    text?: string;                     // セリフテキスト
    type?: SceneType;                  // シーンタイプ (デフォルト: "narration")
    duration?: number;                 // 表示時間（秒）音声長から自動計算可
    emotion?: Emotion;                 // 感情 (デフォルト: "normal")
    action?: Action;                   // アクション (デフォルト: "none")

    // === 表示関連 ===
    title?: string;                    // 左上タイトル
    bg_image?: string;                 // 中央表示画像パス
    image?: string;                    // bg_imageのエイリアス
    bgm?: string;                      // BGMファイルパス

    // === 演出制御（詳細） ===
    camera?: Partial<CameraSettings>;          // カメラ設定
    transition?: TransitionType | TransitionSettings;  // トランジション
    vfx?: Partial<VFXSettings>;                // VFX設定
    telop?: Partial<TelopSettings>;            // テロップ設定
    direction?: Partial<DirectionHints>;       // 演出ヒント

    // === 下位互換性 ===
    comment_text?: string;
    emphasis_words?: string[];         // telop.emphasisWordsへ移行推奨
}

/**
 * 処理済みシーンデータ
 * Remotion側で使用する正規化されたデータ
 */
export interface ProcessedScene {
    id: number;
    speaker: Speaker;
    text: string;
    type: SceneType;
    comment_text?: string;
    audio: string;
    bg_image: string;
    durationInFrames: number;
    emotion: Emotion;
    action: Action;
    bgm: string;
    title?: string;
    // カメラ・エフェクト設定
    camera: CameraSettings;
    transition: TransitionSettings;
    vfx: VFXSettings;
    telop: TelopSettings;
    direction: DirectionHints;
    emphasis_words: string[];  // 下位互換性
}

// ========================================
// シーン状態
// ========================================

/** 現在のシーン状態（フレーム単位で更新） */
export interface SceneState {
    currentScene: ProcessedScene;
    sceneFrame: number;
    sceneIndex: number;
    isEndingScene: boolean;
    totalScenes: number;
    cumulativeFrames: number;
    // トランジション状態
    isInTransition: boolean;
    transitionProgress: number;
}

// ========================================
// 話者情報
// ========================================

/** 話者の表示設定 */
export interface SpeakerInfo {
    name: string;
    color: string;
    textColor: string;
    position: 'left' | 'right';
    voicevoxId: number;        // VOICEVOX話者ID
}

/** 話者設定マップ */
export const SPEAKER_CONFIG: Record<Speaker, SpeakerInfo> = {
    kanon: {
        name: 'かのん',
        color: '#00bfff',
        textColor: '#ffffff',
        position: 'left',
        voicevoxId: 10    // 雨晴はう
    },
    zundamon: {
        name: 'ずんだもん',
        color: '#adff2f',
        textColor: '#000000',
        position: 'right',
        voicevoxId: 3     // ずんだもん
    },
    metan: {
        name: '四国めたん',
        color: '#ff69b4',
        textColor: '#ffffff',
        position: 'left',
        voicevoxId: 2     // 四国めたん
    }
};

// ========================================
// デフォルト値
// ========================================

/** デフォルトのカメラ設定 */
export const DEFAULT_CAMERA: CameraSettings = {
    zoom: 1.0,
    panX: 0,
    panY: 0,
    duration: 0.5
};

/** デフォルトのVFX設定 */
export const DEFAULT_VFX: VFXSettings = {
    shake: 0,
    flash: false,
    concentrationLines: false,
    speedLines: false,
    vignette: true
};

/** デフォルトのトランジション設定 */
export const DEFAULT_TRANSITION: TransitionSettings = {
    type: 'none',
    duration: 18,
    color: '#1a1a2e'
};

/** デフォルトのテロップ設定 */
export const DEFAULT_TELOP: TelopSettings = {
    emphasisWords: [],
    emphasisColor: '#ff3b30',
    showTicker: false,
    hideTitle: false,
    hideDialogBox: false
};

/** デフォルトの演出ヒント */
export const DEFAULT_DIRECTION: DirectionHints = {
    mood: 'calm',
    pacing: 'normal',
    importance: 'normal',
    isTopicChange: false,
    isReaction: false,
    isCutaway: false
};

// ========================================
// ユーティリティ関数
// ========================================

/**
 * TransitionType または TransitionSettings を正規化
 */
function normalizeTransition(
    transition?: TransitionType | TransitionSettings
): TransitionSettings {
    if (!transition) {
        return { ...DEFAULT_TRANSITION };
    }
    if (typeof transition === 'string') {
        return { ...DEFAULT_TRANSITION, type: transition };
    }
    return { ...DEFAULT_TRANSITION, ...transition };
}

/**
 * ThreadItemをProcessedSceneに変換
 */
export function processThreadItem(
    item: ThreadItem,
    fps: number,
    lastBgm: string
): ProcessedScene {
    const telop: TelopSettings = {
        ...DEFAULT_TELOP,
        ...item.telop,
        emphasisWords: item.telop?.emphasisWords || item.emphasis_words || []
    };

    return {
        id: item.id,
        speaker: item.speaker || 'kanon',
        text: item.text || '',
        type: item.type || 'narration',
        comment_text: item.comment_text,
        audio: item.audio,
        bg_image: item.image || item.bg_image || 'images/bg_thread.jpg',
        durationInFrames: Math.ceil((item.duration || 5) * fps),
        emotion: item.emotion || 'normal',
        action: item.action || 'none',
        bgm: item.bgm || lastBgm,
        title: item.title,
        // 演出設定
        camera: { ...DEFAULT_CAMERA, ...item.camera },
        transition: normalizeTransition(item.transition),
        vfx: { ...DEFAULT_VFX, ...item.vfx },
        telop,
        direction: { ...DEFAULT_DIRECTION, ...item.direction },
        emphasis_words: telop.emphasisWords || []
    };
}

/**
 * 演出ヒントに基づいてトランジションを自動選択
 */
export function autoSelectTransition(
    direction: DirectionHints,
    prevScene?: ProcessedScene
): TransitionType {
    if (direction.isTopicChange) {
        return 'logo';
    }
    if (direction.importance === 'climax') {
        return 'flash';
    }
    if (direction.mood === 'dramatic') {
        return 'wipe_left';
    }
    if (direction.isCutaway) {
        return 'dissolve';
    }
    return 'none';
}

/**
 * 感情に基づいてVFXを自動適用
 */
export function autoApplyVFX(emotion: Emotion, action: Action): Partial<VFXSettings> {
    const vfx: Partial<VFXSettings> = {};

    switch (emotion) {
        case 'panic':
            vfx.shake = 4;
            vfx.concentrationLines = true;
            break;
        case 'angry':
            vfx.shake = 2;
            vfx.speedLines = true;
            vfx.colorOverlay = 'rgba(255, 0, 0, 0.15)';
            break;
        case 'surprised':
            vfx.flash = true;
            break;
        case 'sad':
            vfx.colorOverlay = 'rgba(0, 0, 100, 0.1)';
            vfx.vignette = true;
            break;
    }

    if (action === 'run' || action === 'run_left' || action === 'run_right') {
        vfx.speedLines = true;
        vfx.speedLinesDirection = 'horizontal';
    }

    return vfx;
}

// 型の再エクスポート（利便性のため）
export type { Emotion, Action };
