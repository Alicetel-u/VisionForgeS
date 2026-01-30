/**
 * CameraManager - シネマティックカメラ制御
 * 話者フォーカス、Ken Burns効果、感情連動カメラを実装
 *
 * 注意: Remotionでは毎フレーム再レンダリングされるため、
 * useMemoではなく純粋関数として実装
 */

import { interpolate, spring } from 'remotion';
import { ProcessedScene, Speaker, CameraSettings } from '../types';

// ========================================
// 型定義
// ========================================

/** カメラトランスフォーム結果 */
export interface CameraTransform {
    scale: number;
    translateX: number;
    translateY: number;
    rotation: number;
}

/** カメラエフェクトオプション */
export interface CameraEffectOptions {
    enableSpeakerFocus: boolean;
    enableKenBurns: boolean;
    enableEmotionCamera: boolean;
    enableBreathing: boolean;
}

const DEFAULT_OPTIONS: CameraEffectOptions = {
    enableSpeakerFocus: true,
    enableKenBurns: true,
    enableEmotionCamera: true,
    enableBreathing: true
};

// ========================================
// メインカメラ計算関数（純粋関数）
// ========================================

/**
 * シネマティックカメラ効果を計算する純粋関数
 * フックではないので、どこからでも呼び出し可能
 */
export function calculateCinematicCamera(
    scene: ProcessedScene,
    sceneFrame: number,
    globalFrame: number,
    fps: number,
    options: Partial<CameraEffectOptions> = {}
): CameraTransform {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    let scale = scene.camera.zoom;
    let translateX = 0;
    let translateY = 0;
    let rotation = 0;

    // 1. 話者フォーカス（話者に向かって緩やかにパン）
    if (opts.enableSpeakerFocus) {
        const speakerFocus = calculateSpeakerFocus(scene.speaker, sceneFrame, fps);
        translateX += speakerFocus.panX;
        scale *= speakerFocus.zoom;
    }

    // 2. Ken Burns効果（ゆっくりズーム＆パン）
    if (opts.enableKenBurns) {
        const kenBurns = calculateKenBurns(globalFrame);
        scale *= kenBurns.scale;
        translateX += kenBurns.panX;
        translateY += kenBurns.panY;
    }

    // 3. 感情連動カメラ
    if (opts.enableEmotionCamera) {
        const emotionCamera = calculateEmotionCamera(scene.emotion, sceneFrame, fps);
        scale *= emotionCamera.scale;
        translateX += emotionCamera.shakeX;
        translateY += emotionCamera.shakeY;
        rotation += emotionCamera.rotation;
    }

    // 4. 呼吸アニメーション（微細な動き）
    if (opts.enableBreathing) {
        const breathing = calculateBreathing(globalFrame);
        scale *= breathing.scale;
        translateY += breathing.offsetY;
    }

    // 5. シーン開始時のプルバック（ズームアウトから始まる）
    const entranceZoom = calculateEntranceZoom(sceneFrame, fps);
    scale *= entranceZoom;

    return {
        scale,
        translateX,
        translateY,
        rotation
    };
}

// ========================================
// 個別カメラ効果の計算関数
// ========================================

/**
 * 話者フォーカス効果
 */
function calculateSpeakerFocus(
    speaker: Speaker,
    sceneFrame: number,
    fps: number
): { panX: number; zoom: number } {
    const transition = spring({
        frame: sceneFrame,
        fps,
        config: {
            damping: 50,
            stiffness: 30,
            mass: 1
        }
    });

    const targetPanX = speaker === 'kanon' ? -15 : 15;
    const panX = interpolate(transition, [0, 1], [0, targetPanX]);
    const targetZoom = 1.02;
    const zoom = interpolate(transition, [0, 1], [1, targetZoom]);

    return { panX, zoom };
}

/**
 * Ken Burns効果
 */
function calculateKenBurns(
    globalFrame: number
): { scale: number; panX: number; panY: number } {
    const slowZoomCycle = Math.sin(globalFrame / 600) * 0.01;
    const slowPanX = Math.sin(globalFrame / 400) * 5;
    const slowPanY = Math.cos(globalFrame / 500) * 3;

    return {
        scale: 1 + slowZoomCycle,
        panX: slowPanX,
        panY: slowPanY
    };
}

/**
 * 感情連動カメラ
 */
function calculateEmotionCamera(
    emotion: string,
    sceneFrame: number,
    fps: number
): { scale: number; shakeX: number; shakeY: number; rotation: number } {
    let scale = 1;
    let shakeX = 0;
    let shakeY = 0;
    let rotation = 0;

    switch (emotion) {
        case 'surprised':
            if (sceneFrame < 10) {
                const impact = interpolate(sceneFrame, [0, 5, 10], [1, 1.08, 1.02]);
                scale = impact;
            }
            break;

        case 'angry':
            scale = 1.03;
            shakeX = Math.sin(sceneFrame * 2) * 2;
            shakeY = Math.cos(sceneFrame * 2.5) * 1;
            break;

        case 'panic':
            // パニック時は決定的な振動（Math.randomを避ける）
            shakeX = Math.sin(sceneFrame * 3.7) * 4;
            shakeY = Math.cos(sceneFrame * 4.3) * 3;
            rotation = Math.sin(sceneFrame * 2.1) * 0.3;
            break;

        case 'sad':
            scale = 0.98;
            shakeY = 5;
            break;

        case 'happy':
            shakeY = Math.sin(sceneFrame / 8) * 2;
            scale = 1 + Math.sin(sceneFrame / 15) * 0.01;
            break;

        case 'impressed':
            const impressedZoom = spring({
                frame: sceneFrame,
                fps,
                config: { damping: 100, stiffness: 20 }
            });
            scale = interpolate(impressedZoom, [0, 1], [1, 1.05]);
            break;

        default:
            break;
    }

    return { scale, shakeX, shakeY, rotation };
}

/**
 * 呼吸アニメーション
 */
function calculateBreathing(
    globalFrame: number
): { scale: number; offsetY: number } {
    const breatheCycle = Math.sin(globalFrame / 60);

    return {
        scale: 1 + breatheCycle * 0.002,
        offsetY: breatheCycle * 1
    };
}

/**
 * シーン開始時のズームイン
 */
function calculateEntranceZoom(
    sceneFrame: number,
    fps: number
): number {
    const entrance = spring({
        frame: sceneFrame,
        fps,
        config: {
            damping: 80,
            stiffness: 40,
            mass: 1.5
        }
    });

    return interpolate(entrance, [0, 1], [1.03, 1]);
}

// ========================================
// CSS変換ユーティリティ
// ========================================

/**
 * CameraTransformをCSS transform文字列に変換
 */
export function cameraTransformToCSS(transform: CameraTransform): string {
    return `scale(${transform.scale}) translate(${transform.translateX}px, ${transform.translateY}px) rotate(${transform.rotation}deg)`;
}

/**
 * カメラスタイルオブジェクトを生成
 */
export function getCameraStyle(transform: CameraTransform): React.CSSProperties {
    return {
        transform: cameraTransformToCSS(transform),
        transformOrigin: 'center center'
    };
}

// ========================================
// プリセットカメラ設定
// ========================================

export const CAMERA_PRESETS: Record<string, Partial<CameraSettings>> = {
    static: { zoom: 1.0, panX: 0, panY: 0 },
    wide: { zoom: 0.95, panX: 0, panY: 0 },
    closeup: { zoom: 1.15, panX: 0, panY: -0.1 },
    focusLeft: { zoom: 1.05, panX: -0.15, panY: 0 },
    focusRight: { zoom: 1.05, panX: 0.15, panY: 0 },
    dramatic: { zoom: 1.2, panX: 0, panY: -0.05 }
};

export function getEmotionCameraPreset(emotion: string): Partial<CameraSettings> {
    switch (emotion) {
        case 'surprised':
        case 'panic':
            return CAMERA_PRESETS.closeup;
        case 'angry':
            return CAMERA_PRESETS.dramatic;
        case 'sad':
            return CAMERA_PRESETS.wide;
        case 'happy':
        case 'impressed':
            return CAMERA_PRESETS.closeup;
        default:
            return CAMERA_PRESETS.static;
    }
}
