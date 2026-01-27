import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

// 集中線（集中線 / Focus Lines）
export const ConcentrationLines: React.FC<{ opacity: number }> = ({ opacity }) => {
    const frame = useCurrentFrame();
    // 線の動きを作るためにフレームで回転させる
    const rotation = (frame * 5) % 10;

    return (
        <AbsoluteFill style={{
            opacity,
            pointerEvents: 'none',
            zIndex: 50,
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `repeating-conic-gradient(
                    transparent 0deg,
                    transparent 1.5deg,
                    rgba(255, 255, 255, 0.8) 1.6deg,
                    rgba(255, 255, 255, 0.9) 2.0deg,
                    rgba(255, 255, 255, 0.8) 2.4deg,
                    transparent 2.5deg,
                    transparent 4deg
                )`,
                maskImage: 'radial-gradient(circle, transparent 15%, black 60%)',
                WebkitMaskImage: 'radial-gradient(circle, transparent 15%, black 60%)',
                transform: `rotate(${rotation}deg)`,
            }} />
        </AbsoluteFill>
    );
};

// 画面シェイク（揺れ）
export const getShakeStyle = (frame: number, intensity: number) => {
    if (intensity === 0) return {};
    const x = Math.sin(frame * 1.5) * intensity * (Math.random() > 0.5 ? 1 : -1);
    const y = Math.cos(frame * 1.8) * intensity * (Math.random() > 0.5 ? 1 : -1);
    return {
        transform: `translate(${x}px, ${y}px)`
    };
};

// 感情カラーオーバーレイ
export const MoodOverlay: React.FC<{ emotion: string, opacity: number }> = ({ emotion, opacity }) => {
    let color = 'transparent';
    let mixBlendMode: 'normal' | 'multiply' | 'overlay' | 'hard-light' = 'normal';

    switch (emotion) {
        case 'angry':
            color = 'rgba(255, 0, 0, 0.3)';
            mixBlendMode = 'overlay';
            break;
        case 'panic':
            color = 'rgba(0, 0, 0, 0.2)';
            mixBlendMode = 'multiply';
            break;
        case 'sad':
            color = 'rgba(0, 0, 255, 0.2)';
            mixBlendMode = 'multiply';
            break;
        case 'happy':
            color = 'rgba(255, 255, 0, 0.15)';
            mixBlendMode = 'overlay';
            break;
        case 'surprised':
            color = 'rgba(255, 255, 255, 0.2)';
            mixBlendMode = 'overlay';
            break;
        default:
            return null;
    }

    return (
        <AbsoluteFill style={{
            backgroundColor: color,
            mixBlendMode,
            opacity: opacity,
            pointerEvents: 'none',
            zIndex: 150
        }} />
    );
};

// 衝撃波エフェクト（驚いた時などに一瞬）
export const ImpactEffect: React.FC<{ frame: number }> = ({ frame }) => {
    const scale = interpolate(frame, [0, 10], [1, 3], { extrapolateRight: 'clamp' });
    const opacity = interpolate(frame, [0, 10], [0.8, 0], { extrapolateRight: 'clamp' });

    if (frame > 10) return null;

    return (
        <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', zIndex: 160 }}>
            <div style={{
                width: 500,
                height: 500,
                border: '20px solid rgba(255,255,255,0.8)',
                borderRadius: '50%',
                transform: `scale(${scale})`,
                opacity: opacity
            }} />
        </AbsoluteFill>
    );
};
// 画面フラッシュ（一瞬だけ光る）
export const ScreenFlash: React.FC<{ frame: number, color?: string }> = ({ frame, color = 'white' }) => {
    const opacity = interpolate(frame, [0, 2, 8], [0, 0.8, 0], { extrapolateRight: 'clamp' });
    if (frame > 10) return null;
    return <AbsoluteFill style={{ backgroundColor: color, opacity, zIndex: 500, pointerEvents: 'none' }} />;
};

// 漫画風オノマトペ（ドンッ！！等） - 迫力強化版
export const Onomatopoeia: React.FC<{ text: string, frame: number, color?: string }> = ({ text, frame, color = '#ff0000' }) => {
    // 爆発的な登場アニメーション
    const scale = interpolate(
        frame,
        [0, 2, 5],
        [3.5, 1, 1.1], // 超巨大から一気に縮小して少し跳ねる
        { extrapolateRight: 'clamp' }
    );
    const opacity = interpolate(frame, [0, 1, 15, 20], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

    // 文字をわずかに震わせる（残響）
    const shakeX = Math.random() * 5 * (frame < 10 ? 1 : 0);
    const shakeY = Math.random() * 5 * (frame < 10 ? 1 : 0);
    const rotation = -10 + (Math.sin(frame) * 2);

    if (frame > 25) return null;

    return (
        <AbsoluteFill style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 400,
        }}>
            <div style={{
                fontSize: 240, // さらに大きく
                fontWeight: 900,
                color: 'white',
                transform: `scale(${scale}) rotate(${rotation}deg) translate(${shakeX}px, ${shakeY}px)`,
                opacity,
                fontFamily: '"Arial Black", "Hiragino Kaku Gothic ProN", sans-serif',
                letterSpacing: '-10px',
                lineHeight: 1,
                // 超重厚な縁取り
                textShadow: `
                    -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,
                    -4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000,
                    -8px -8px 0 #000, 8px -8px 0 #000, -8px 8px 0 #000, 8px 8px 0 #000,
                    -12px -12px 0 #000, 12px -12px 0 #000, -12px 12px 0 #000, 12px 12px 0 #000,
                    0 20px 40px rgba(0,0,0,0.8)
                `,
            }}>
                {text}
            </div>
        </AbsoluteFill>
    );
};

// スピード線（横に流れる線）
export const SpeedLines: React.FC<{ opacity: number, color?: string, direction?: 'horizontal' | 'vertical' }> = ({ opacity, color = 'rgba(255,255,255,0.3)', direction = 'horizontal' }) => {
    const frame = useCurrentFrame();
    const offset = (frame * 40) % 100;

    return (
        <AbsoluteFill style={{ opacity, pointerEvents: 'none', zIndex: 40, overflow: 'hidden' }}>
            <div style={{
                position: 'absolute',
                width: '200%',
                height: '200%',
                top: '-50%',
                left: '-50%',
                background: direction === 'horizontal'
                    ? `repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.8) 11px, rgba(255,255,255,1) 12px, transparent 13px, transparent 20px)`
                    : `repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.8) 11px, rgba(255,255,255,1) 12px, transparent 13px, transparent 20px)`,
                transform: direction === 'horizontal' ? `translateX(-${offset}px)` : `translateY(-${offset}px)`,
            }} />
        </AbsoluteFill>
    );
};

// 漫符（怒りマーク、汗、電球など）
export const EmblemEffect: React.FC<{ type: 'angry' | 'sweat' | 'lightbulb', frame: number, x: number | string, y: number | string }> = ({ type, frame, x, y }) => {
    const opacity = interpolate(frame, [0, 5, 20, 25], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
    const scale = interpolate(frame, [0, 5], [0, 1.2], { extrapolateRight: 'clamp' }) * (1 + Math.sin(frame * 0.5) * 0.1);

    let content = '';

    switch (type) {
        case 'angry': content = '💢'; break;
        case 'sweat': content = '💦'; break;
        case 'lightbulb': content = '💡'; break;
    }

    if (frame > 30) return null;

    return (
        <div style={{
            position: 'absolute',
            left: x,
            top: y,
            fontSize: 100,
            opacity,
            transform: `scale(${scale})`,
            zIndex: 300,
            textShadow: '0 0 10px white, 0 0 20px white',
            pointerEvents: 'none'
        }}>
            {content}
        </div>
    );
};

// ベタフラッシュ（背負いの衝撃）
export const BetaFlash: React.FC<{ frame: number, opacity: number }> = ({ frame, opacity }) => {
    const rotation = (frame * 10) % 360;
    const scale = 1 + Math.sin(frame * 0.8) * 0.1;

    return (
        <AbsoluteFill style={{ opacity, pointerEvents: 'none', zIndex: 30, overflow: 'hidden' }}>
            <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `conic-gradient(from ${rotation}deg, black 0deg, white 2deg, black 4deg, white 6deg, black 8deg, white 10deg, black 12deg, white 14deg, black 16deg, white 18deg, black 20deg)`,
                maskImage: 'radial-gradient(circle, transparent 10%, black 50%)',
                WebkitMaskImage: 'radial-gradient(circle, transparent 10%, black 50%)',
                transform: `scale(${scale * 1.2})`,
            }} />
        </AbsoluteFill>
    );
};
