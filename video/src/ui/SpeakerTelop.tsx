/**
 * SpeakerTelop - L字型名前テロップ
 * 話者名をスタイリッシュに表示
 */

import React from 'react';
import { spring, useVideoConfig, interpolate } from 'remotion';
import { Speaker, SPEAKER_CONFIG } from '../types';

interface SpeakerTelopProps {
    speaker: Speaker;
    sceneFrame: number;
    isPreview: boolean;
}

/**
 * 話者テロップコンポーネント
 */
export const SpeakerTelop: React.FC<SpeakerTelopProps> = ({
    speaker,
    sceneFrame,
    isPreview
}) => {
    const { fps } = useVideoConfig();
    const config = SPEAKER_CONFIG[speaker];

    // 登場アニメーション（弾む）
    const entrance = spring({
        frame: sceneFrame,
        fps,
        config: { damping: 12, stiffness: 200 }
    });

    // スライドイン + スケール
    const slideY = interpolate(entrance, [0, 1], [30, 0]);
    const scale = interpolate(entrance, [0, 0.5, 1], [0.8, 1.1, 1]);
    const opacity = interpolate(entrance, [0, 0.3], [0, 1]);

    // 輝きエフェクト（登場時のみ）
    const glowOpacity = interpolate(sceneFrame, [0, 10, 20], [0, 0.8, 0], {
        extrapolateRight: 'clamp'
    });

    return (
        <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'stretch',
            transform: `translateY(${slideY}px) scale(${scale})`,
            opacity,
            filter: isPreview ? 'none' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
        }}>
            {/* L字の縦棒 */}
            <div style={{
                width: 8,
                background: `linear-gradient(180deg, ${config.color} 0%, ${adjustBrightness(config.color, -20)} 100%)`,
                borderRadius: '8px 0 0 8px',
                boxShadow: isPreview ? 'none' : `0 0 15px ${config.color}40`
            }} />

            {/* メインコンテナ */}
            <div style={{
                position: 'relative',
                background: `linear-gradient(135deg, ${config.color} 0%, ${adjustBrightness(config.color, -15)} 100%)`,
                padding: '10px 28px 10px 18px',
                borderRadius: '0 12px 12px 0',
                overflow: 'hidden'
            }}>
                {/* 輝きオーバーレイ */}
                {!isPreview && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle at 30% 50%, rgba(255,255,255,${glowOpacity * 0.4}) 0%, transparent 60%)`,
                        pointerEvents: 'none'
                    }} />
                )}

                {/* 名前テキスト */}
                <div style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: config.textColor,
                    letterSpacing: '1px',
                    textShadow: config.textColor === '#000000'
                        ? 'none'
                        : '0 1px 3px rgba(0,0,0,0.3)',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    zIndex: 1
                }}>
                    {config.name}
                </div>

                {/* 下部アクセントライン */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, rgba(255,255,255,0.4) 0%, transparent 100%)`
                }} />
            </div>

            {/* 三角形のアクセント */}
            <div style={{
                position: 'absolute',
                right: -12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '15px solid transparent',
                borderBottom: '15px solid transparent',
                borderLeft: `12px solid ${adjustBrightness(config.color, -15)}`,
                filter: isPreview ? 'none' : 'drop-shadow(2px 0 4px rgba(0,0,0,0.2))'
            }} />
        </div>
    );
};

/**
 * 色の明度を調整するヘルパー関数
 */
function adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export default SpeakerTelop;
