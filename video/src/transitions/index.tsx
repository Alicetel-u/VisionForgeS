/**
 * トランジションシステム - エントリーポイント
 * 番組レベルのシーン切り替え演出を提供
 */

import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';

// ========================================
// 型定義
// ========================================

/** トランジションタイプ */
export type TransitionType =
    | 'none'
    | 'fade'
    | 'wipe_left'
    | 'wipe_right'
    | 'wipe_up'
    | 'wipe_down'
    | 'logo'
    | 'flash'
    | 'zoom'
    | 'slide'
    | 'dissolve';

/** トランジション設定 */
export interface TransitionConfig {
    type: TransitionType;
    duration?: number;      // フレーム数（デフォルト: 18）
    color?: string;        // ワイプ色など
    logoText?: string;     // ロゴテキスト
    easing?: 'linear' | 'ease' | 'spring';
    direction?: 'in' | 'out';  // ズームトランジションの方向
}

/** トランジションのデフォルト設定 */
export const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
    type: 'none',
    duration: 15,
    color: '#ff3b30',
    easing: 'spring'
};

/** トランジション実行時間（フレーム） */
export const TRANSITION_DURATION = 36; // 1.2秒（タイトルを読める＆音声とのタイミング調整）

// ========================================
// ワイプトランジション
// ========================================

interface WipeTransitionProps {
    progress: number;          // 0-1
    direction: 'left' | 'right' | 'up' | 'down';
    color?: string;
    accentColor?: string;
}

export const WipeTransition: React.FC<WipeTransitionProps> = ({
    progress,
    direction,
    color = '#1a1a2e',
    accentColor = '#ff3b30'
}) => {
    // ワイプの位置計算
    const getTransform = () => {
        const eased = easeOutCubic(progress);
        const pos = eased * 100;

        switch (direction) {
            case 'left':
                return `translateX(${100 - pos}%)`;
            case 'right':
                return `translateX(${-100 + pos}%)`;
            case 'up':
                return `translateY(${100 - pos}%)`;
            case 'down':
                return `translateY(${-100 + pos}%)`;
        }
    };

    // アクセントラインの位置
    const getAccentStyle = (): React.CSSProperties => {
        const isHorizontal = direction === 'left' || direction === 'right';
        const leading = direction === 'left' || direction === 'up';

        return {
            position: 'absolute',
            background: `linear-gradient(${isHorizontal ? '90deg' : '180deg'}, ${accentColor}, ${accentColor}dd, transparent)`,
            boxShadow: `0 0 30px ${accentColor}, 0 0 60px ${accentColor}80`,
            ...(isHorizontal
                ? {
                    width: 8,
                    height: '100%',
                    top: 0,
                    [leading ? 'left' : 'right']: 0,
                }
                : {
                    width: '100%',
                    height: 8,
                    left: 0,
                    [leading ? 'top' : 'bottom']: 0,
                }
            )
        };
    };

    if (progress <= 0 || progress >= 1) return null;

    return (
        <AbsoluteFill style={{ zIndex: 9000, pointerEvents: 'none' }}>
            {/* メインワイプ */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${color} 0%, ${color}ee 50%, ${color}dd 100%)`,
                transform: getTransform(),
                willChange: 'transform'
            }}>
                {/* アクセントライン */}
                <div style={getAccentStyle()} />

                {/* 装飾パターン */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.1,
                    background: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 10px,
                        rgba(255,255,255,0.1) 10px,
                        rgba(255,255,255,0.1) 20px
                    )`
                }} />
            </div>
        </AbsoluteFill>
    );
};

// ========================================
// ロゴトランジション
// ========================================

interface LogoTransitionProps {
    progress: number;          // 0-1
    logoText?: string;
    primaryColor?: string;
    secondaryColor?: string;
}

export const LogoTransition: React.FC<LogoTransitionProps> = ({
    progress,
    logoText = 'NEWS',
    primaryColor = '#ff3b30',
    secondaryColor = '#1a1a2e'
}) => {
    const { fps } = useVideoConfig();

    // フェーズ分割: 0-0.15 展開、0.15-0.85 ロゴ表示、0.85-1.0 収束
    // タイトルを十分読める時間を確保
    const expandProgress = interpolate(progress, [0, 0.15], [0, 1], { extrapolateRight: 'clamp' });
    const logoProgress = interpolate(progress, [0.12, 0.2, 0.8, 0.88], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const contractProgress = interpolate(progress, [0.85, 1], [0, 1], { extrapolateLeft: 'clamp' });

    // 上下からのワイプ
    const topY = interpolate(expandProgress, [0, 1], [-100, 0]);
    const bottomY = interpolate(expandProgress, [0, 1], [100, 0]);

    // 収束時の動き
    const exitTopY = interpolate(contractProgress, [0, 1], [0, -100]);
    const exitBottomY = interpolate(contractProgress, [0, 1], [0, 100]);

    // ロゴのスケールと透明度
    // logoProgress は [0→1→1→0] と変化するので、そのまま透明度として使用
    const logoScale = interpolate(logoProgress, [0, 1], [0.8, 1.05]);
    const logoOpacity = logoProgress; // 帯が閉まっている間ずっと文字を表示

    if (progress <= 0 || progress >= 1) return null;

    return (
        <AbsoluteFill style={{ zIndex: 9000, pointerEvents: 'none' }}>
            {/* 上部パネル */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: `linear-gradient(180deg, ${secondaryColor} 0%, ${secondaryColor}f0 100%)`,
                transform: `translateY(${progress < 0.85 ? topY : exitTopY}%)`,
                willChange: 'transform'
            }}>
                {/* アクセントライン */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: primaryColor,
                    boxShadow: `0 0 20px ${primaryColor}`
                }} />
            </div>

            {/* 下部パネル */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: `linear-gradient(0deg, ${secondaryColor} 0%, ${secondaryColor}f0 100%)`,
                transform: `translateY(${progress < 0.85 ? bottomY : exitBottomY}%)`,
                willChange: 'transform'
            }}>
                {/* アクセントライン */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: primaryColor,
                    boxShadow: `0 0 20px ${primaryColor}`
                }} />
            </div>

            {/* センターロゴ */}
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: logoOpacity,
                transform: `scale(${logoScale})`,
                willChange: 'transform, opacity',
                padding: '0 60px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    maxWidth: '100%'
                }}>
                    {/* ロゴアイコン */}
                    <div style={{
                        width: 56,
                        height: 56,
                        minWidth: 56,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 30px ${primaryColor}80`
                    }}>
                        <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'white',
                            opacity: 0.9
                        }} />
                    </div>

                    {/* ロゴテキスト */}
                    <div style={{
                        fontSize: 44,
                        fontWeight: 900,
                        color: 'white',
                        letterSpacing: '4px',
                        textShadow: `0 0 20px ${primaryColor}, 0 3px 15px rgba(0,0,0,0.5)`,
                        textAlign: 'center',
                        lineHeight: 1.3
                    }}>
                        {logoText}
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};

// ========================================
// フラッシュトランジション
// ========================================

interface FlashTransitionProps {
    progress: number;          // 0-1
    color?: string;
    intensity?: number;
}

export const FlashTransition: React.FC<FlashTransitionProps> = ({
    progress,
    color = 'white',
    intensity = 1
}) => {
    // フラッシュカーブ：急激に上がって緩やかに下がる
    const flashOpacity = interpolate(
        progress,
        [0, 0.1, 0.3, 1],
        [0, intensity, intensity * 0.8, 0],
        { extrapolateRight: 'clamp' }
    );

    if (flashOpacity <= 0.01) return null;

    return (
        <AbsoluteFill style={{
            backgroundColor: color,
            opacity: flashOpacity,
            zIndex: 9000,
            pointerEvents: 'none',
            mixBlendMode: 'screen'
        }} />
    );
};

// ========================================
// ズームトランジション
// ========================================

interface ZoomTransitionProps {
    progress: number;
    direction: 'in' | 'out';
    color?: string;
}

export const ZoomTransition: React.FC<ZoomTransitionProps> = ({
    progress,
    direction,
    color = '#000'
}) => {
    const eased = easeOutCubic(progress);

    // ズームイン：円が大きくなって画面を覆う
    // ズームアウト：円が小さくなって画面が現れる
    const scale = direction === 'in'
        ? interpolate(eased, [0, 1], [0, 3])
        : interpolate(eased, [0, 1], [3, 0]);

    if (progress <= 0 || progress >= 1) return null;

    return (
        <AbsoluteFill style={{ zIndex: 9000, pointerEvents: 'none' }}>
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '150vmax',
                height: '150vmax',
                borderRadius: '50%',
                background: color,
                transform: `translate(-50%, -50%) scale(${scale})`,
                willChange: 'transform'
            }} />
        </AbsoluteFill>
    );
};

// ========================================
// ディゾルブトランジション
// ========================================

interface DissolveTransitionProps {
    progress: number;
}

export const DissolveTransition: React.FC<DissolveTransitionProps> = ({
    progress
}) => {
    const opacity = interpolate(progress, [0, 0.5, 1], [0, 1, 0]);

    if (opacity <= 0.01) return null;

    return (
        <AbsoluteFill style={{
            backgroundColor: 'black',
            opacity,
            zIndex: 9000,
            pointerEvents: 'none'
        }} />
    );
};

// ========================================
// トランジションレンダラー
// ========================================

interface TransitionRendererProps {
    config: TransitionConfig;
    progress: number;
}

export const TransitionRenderer: React.FC<TransitionRendererProps> = ({
    config,
    progress
}) => {
    switch (config.type) {
        case 'wipe_left':
            return <WipeTransition progress={progress} direction="left" color={config.color} />;
        case 'wipe_right':
            return <WipeTransition progress={progress} direction="right" color={config.color} />;
        case 'wipe_up':
            return <WipeTransition progress={progress} direction="up" color={config.color} />;
        case 'wipe_down':
            return <WipeTransition progress={progress} direction="down" color={config.color} />;
        case 'logo':
            return <LogoTransition progress={progress} logoText={config.logoText} primaryColor={config.color} />;
        case 'flash':
            return <FlashTransition progress={progress} />;
        case 'zoom':
            return <ZoomTransition progress={progress} direction="in" color={config.color} />;
        case 'dissolve':
            return <DissolveTransition progress={progress} />;
        case 'fade':
            return <DissolveTransition progress={progress} />;
        default:
            return null;
    }
};

// ========================================
// ユーティリティ
// ========================================

/** イージング関数 */
function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** トランジション進行度を計算 */
export function calculateTransitionProgress(
    sceneFrame: number,
    sceneDuration: number,
    transitionDuration: number = TRANSITION_DURATION
): { inProgress: number; outProgress: number } {
    // シーン開始時のトランジション（イン）
    const inProgress = interpolate(
        sceneFrame,
        [0, transitionDuration],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    // シーン終了時のトランジション（アウト）
    const outStart = sceneDuration - transitionDuration;
    const outProgress = interpolate(
        sceneFrame,
        [outStart, sceneDuration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    return { inProgress, outProgress };
}
