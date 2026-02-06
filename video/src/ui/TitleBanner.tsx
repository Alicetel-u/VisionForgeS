/**
 * TitleBanner - プレミアムタイトル表示
 * 高品質なグラデーション、マルチレイヤー光沢、微振動アニメーション
 * TV番組のロゴ品質を目指したデザイン
 */

import React from 'react';
import { spring, useVideoConfig, interpolate } from 'remotion';

interface TitleBannerProps {
    title: string;
    sceneFrame: number;
    isPreview: boolean;
    skipEntrance?: boolean;
}

/**
 * タイトルバナーコンポーネント
 */
export const TitleBanner: React.FC<TitleBannerProps> = ({
    title,
    sceneFrame,
    isPreview,
    skipEntrance
}) => {
    const { fps } = useVideoConfig();

    // 登場アニメーション（弾むような動き）
    const entrance = skipEntrance ? 1 : spring({
        frame: sceneFrame,
        fps,
        config: { damping: 12, stiffness: 120, mass: 0.8 }
    });

    // 微振動（存在感の演出 - 複数の波を合成）
    const microVibrateY = Math.sin(sceneFrame / 8) * 0.4 + Math.sin(sceneFrame / 13) * 0.2;
    const microVibrateX = Math.sin(sceneFrame / 11) * 0.15;

    // マルチレイヤー光沢アニメーション
    const shimmerPosition1 = (sceneFrame * 2.5) % 250 - 50;
    const shimmerPosition2 = ((sceneFrame + 30) * 1.8) % 300 - 100;

    // スライドイン（オーバーシュート付き）
    const slideX = interpolate(entrance, [0, 1], [-120, 0]);

    // 登場時のフェードイン
    const opacity = interpolate(entrance, [0, 0.2, 1], [0, 0.3, 1]);

    // 呼吸アニメーション（スケール）
    const breathScale = 1 + Math.sin(sceneFrame / 25) * 0.008;

    // グロー強度の変動
    const glowIntensity = 0.6 + Math.sin(sceneFrame / 15) * 0.2;

    // LIVEインジケーターのパルス
    const pulseScale = 1 + Math.sin(sceneFrame / 6) * 0.3;
    const pulseOpacity = 0.6 + Math.sin(sceneFrame / 6) * 0.4;

    return (
        <div style={{
            position: 'absolute',
            bottom: 200, // 下部配置（コメント欄などを避ける位置）
            left: 20,
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            filter: isPreview ? 'none' : `drop-shadow(0 15px 30px rgba(0,0,0,0.5)) drop-shadow(0 5px 15px rgba(255,59,48,${glowIntensity * 0.3}))`,
            opacity,
            transform: `translateX(${slideX + microVibrateX}px) translateY(${microVibrateY}px) scale(${breathScale})`
        }}>
            {/* メインバナー */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                background: `linear-gradient(
                    135deg,
                    rgba(15, 15, 20, 0.97) 0%,
                    rgba(25, 25, 35, 0.97) 40%,
                    rgba(35, 35, 50, 0.97) 100%
                )`,
                backdropFilter: isPreview ? 'none' : 'blur(16px)',
                padding: '20px 40px 20px 28px',
                borderRadius: '0 18px 18px 0',
                maxWidth: 650,
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: isPreview ? 'none' : `
                    inset 0 1px 0 rgba(255,255,255,0.15),
                    inset 0 -1px 0 rgba(0,0,0,0.4),
                    inset 0 20px 40px rgba(255,255,255,0.02)
                `
            }}>
                {/* 左側アクセントバー（グラデーション強化） */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 7,
                    background: `linear-gradient(
                        180deg,
                        #ff5a4d 0%,
                        #ff3b30 30%,
                        #ff6b5b 50%,
                        #ff3b30 70%,
                        #ff5a4d 100%
                    )`,
                    boxShadow: isPreview ? 'none' : `
                        0 0 25px rgba(255, 59, 48, ${glowIntensity}),
                        0 0 50px rgba(255, 59, 48, ${glowIntensity * 0.5}),
                        inset 0 0 10px rgba(255,255,255,0.3)
                    `
                }} />

                {/* 上部エッジハイライト */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 7,
                    right: 0,
                    height: 1,
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1), transparent)',
                    pointerEvents: 'none'
                }} />

                {/* 第1光沢レイヤー（メイン） */}
                {!isPreview && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(
                            100deg,
                            transparent ${shimmerPosition1 - 40}%,
                            rgba(255,255,255,0.08) ${shimmerPosition1 - 10}%,
                            rgba(255,255,255,0.15) ${shimmerPosition1}%,
                            rgba(255,255,255,0.08) ${shimmerPosition1 + 10}%,
                            transparent ${shimmerPosition1 + 40}%
                        )`,
                        pointerEvents: 'none'
                    }} />
                )}

                {/* 第2光沢レイヤー（サブ） */}
                {!isPreview && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(
                            115deg,
                            transparent ${shimmerPosition2 - 60}%,
                            rgba(255,200,150,0.05) ${shimmerPosition2 - 20}%,
                            rgba(255,220,180,0.08) ${shimmerPosition2}%,
                            rgba(255,200,150,0.05) ${shimmerPosition2 + 20}%,
                            transparent ${shimmerPosition2 + 60}%
                        )`,
                        pointerEvents: 'none'
                    }} />
                )}

                {/* タイトルテキスト（グラデーション＆シャドウ強化） */}
                <div style={{
                    position: 'relative',
                    fontSize: title.length > 20 ? 22 : title.length > 15 ? 26 : 32,
                    fontWeight: 900,
                    background: isPreview
                        ? 'none'
                        : 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 50%, #e0e0e0 100%)',
                    WebkitBackgroundClip: isPreview ? 'unset' : 'text',
                    WebkitTextFillColor: isPreview ? '#ffffff' : 'transparent',
                    color: '#ffffff',
                    lineHeight: 1.35,
                    letterSpacing: title.length > 15 ? '0px' : '1px',
                    whiteSpace: 'nowrap',
                    maxWidth: 580,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: isPreview ? 'none' : `
                        0 2px 4px rgba(0,0,0,0.6),
                        0 4px 8px rgba(0,0,0,0.3),
                        0 0 30px rgba(255,255,255,0.1)
                    `
                }}>
                    {title || 'カノン＆ずんだもん'}
                </div>

                {/* 瞬間フラッシュ（登場時） */}
                {!isPreview && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        transform: `translateX(${(entrance - 0.5) * 200}%)`,
                        opacity: interpolate(entrance, [0.5, 0.8, 1], [0, 0.6, 0]),
                        mixBlendMode: 'overlay',
                        pointerEvents: 'none'
                    }} />
                )}

                {/* 装飾ライン（アニメーション付き） */}
                <div style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 22,
                    right: 22,
                    height: 2,
                    background: `linear-gradient(
                        90deg,
                        rgba(255,59,48,0.9) 0%,
                        rgba(255,100,80,0.6) 40%,
                        transparent 100%
                    )`,
                    borderRadius: 1,
                    boxShadow: isPreview ? 'none' : '0 0 8px rgba(255,59,48,0.5)'
                }} />

                {/* 右下コーナー装飾 */}
                <div style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 12,
                    width: 20,
                    height: 20,
                    borderRight: '2px solid rgba(255,59,48,0.4)',
                    borderBottom: '2px solid rgba(255,59,48,0.4)',
                    borderRadius: '0 0 6px 0'
                }} />
            </div>

            {/* サブインジケーター（LIVE風 - 強化版） */}
            <div style={{
                marginTop: 10,
                marginLeft: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10
            }}>
                {/* パルスサークル（アウター） */}
                <div style={{
                    position: 'relative',
                    width: 12,
                    height: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* パルスリング */}
                    {!isPreview && (
                        <div style={{
                            position: 'absolute',
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            border: '2px solid rgba(255,59,48,0.5)',
                            transform: `scale(${pulseScale})`,
                            opacity: 1 - (pulseScale - 1) / 0.3 * 0.7
                        }} />
                    )}
                    {/* コアドット */}
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff5a4d 0%, #ff3b30 100%)',
                        boxShadow: isPreview ? 'none' : `
                            0 0 ${10 * pulseOpacity}px rgba(255,59,48,${pulseOpacity}),
                            0 0 ${20 * pulseOpacity}px rgba(255,59,48,${pulseOpacity * 0.5})
                        `
                    }} />
                </div>

                <span style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.85)',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    textShadow: isPreview ? 'none' : '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                    LIVE
                </span>

                {/* 装飾ドット */}
                <div style={{
                    display: 'flex',
                    gap: 4,
                    marginLeft: 6
                }}>
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            style={{
                                width: 3,
                                height: 3,
                                borderRadius: '50%',
                                background: `rgba(255,255,255,${0.3 + i * 0.15})`,
                                transform: `scale(${1 + Math.sin((sceneFrame + i * 8) / 10) * 0.2})`
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TitleBanner;
