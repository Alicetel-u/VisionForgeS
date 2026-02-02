/**
 * BackgroundLayer - 背景レイヤー
 * シネマティックカメラ効果を含む背景表示を担当
 */

import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { ProcessedScene } from '../types';
import { calculateCinematicCamera, getCameraStyle } from '../managers/CameraManager';

interface BackgroundLayerProps {
    scene: ProcessedScene;
    sceneFrame: number;
    isPreview: boolean;
    isEndingScene: boolean;
    prevBgImage?: string;
}

/**
 * 背景レイヤーコンポーネント
 */
export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
    scene,
    sceneFrame,
    isPreview,
    isEndingScene,
    prevBgImage
}) => {
    const globalFrame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 背景画像の決定
    const bgImage = isEndingScene
        ? (scene.bg_image || 'images/bg_ending_neon.jpg')
        : 'images/bg_kanon_room.png';

    // シネマティックカメラ効果の計算（純粋関数呼び出し）
    const cameraTransform = calculateCinematicCamera(
        scene,
        sceneFrame,
        globalFrame,
        fps,
        {
            enableSpeakerFocus: true,
            enableKenBurns: !isPreview,
            enableEmotionCamera: true,
            enableBreathing: !isPreview
        }
    );

    // CSSスタイルに変換
    const cameraStyle = getCameraStyle(cameraTransform);

    return (
        <AbsoluteFill>
            {/* メイン背景（カメラ効果適用） */}
            <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    ...cameraStyle
                }}>
                    <Img
                        src={staticFile(bgImage)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: isPreview
                                ? 'none'
                                : (isEndingScene
                                    ? 'brightness(0.9)'
                                    : 'blur(4px) brightness(1.0)'),
                            opacity: 1.0
                        }}
                    />
                </div>
            </AbsoluteFill>

            {/* ビネット効果（画面端を暗くする） */}
            {!isPreview && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
                    pointerEvents: 'none',
                    zIndex: 40
                }} />
            )}

            {/* 中央画像（ポラロイド風フレーム） */}
            {!isEndingScene && scene.bg_image && scene.bg_image !== 'images/bg_thread.jpg' && (
                <CenterImage
                    imagePath={scene.bg_image}
                    sceneFrame={sceneFrame}
                    isPreview={isPreview}
                    speaker={scene.speaker}
                    skipEntrance={scene.bg_image === prevBgImage}
                />
            )}
        </AbsoluteFill>
    );
};

/**
 * 中央に表示するポラロイド風画像
 */
interface CenterImageProps {
    imagePath: string;
    sceneFrame: number;
    isPreview: boolean;
    speaker: string;
    skipEntrance?: boolean;
}

const CenterImage: React.FC<CenterImageProps> = ({
    imagePath,
    sceneFrame,
    isPreview,
    speaker,
    skipEntrance = false
}) => {
    const { fps } = useVideoConfig();

    // 登場アニメーション（同じ画像が続く場合はスキップ）
    const entrance = skipEntrance ? 1 : spring({
        frame: sceneFrame,
        fps,
        config: { damping: 12, stiffness: 150 }
    });

    // 緩やかな揺れ
    const wobbleRotation = Math.sin(sceneFrame / 30) * 0.8;
    const wobbleY = Math.sin(sceneFrame / 40) * 2;

    // 話者に応じた位置調整
    const speakerOffsetX = speaker === 'kanon' ? -10 : 10;

    // シャドウの動き
    const shadowOffset = 25 + Math.sin(sceneFrame / 50) * 3;

    return (
        <div style={{
            position: 'absolute',
            left: `calc(50% + ${speakerOffsetX}px)`,
            top: 60 + wobbleY,
            transform: `translateX(-50%) rotate(${-1.5 + wobbleRotation}deg) scale(${entrance})`,
            zIndex: 50,
            filter: isPreview ? 'none' : `drop-shadow(0 ${shadowOffset}px 50px rgba(0,0,0,0.6))`,
            opacity: entrance
        }}>
            {/* ポラロイドフレーム */}
            <div style={{
                position: 'relative',
                padding: '12px 12px 40px 12px',
                backgroundColor: '#fff',
                borderRadius: 4,
                boxShadow: isPreview ? 'none' : 'inset 0 0 10px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.08)'
            }}>
                {/* 写真部分 */}
                <div style={{
                    overflow: 'hidden',
                    borderRadius: 2,
                    position: 'relative'
                }}>
                    <Img
                        src={staticFile(imagePath)}
                        style={{
                            width: 520,
                            height: 340,
                            objectFit: 'cover',
                            display: 'block'
                        }}
                    />

                    {/* 光沢効果 */}
                    {!isPreview && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)',
                            pointerEvents: 'none'
                        }} />
                    )}
                </div>

                {/* 下部のテクスチャ */}
                <div style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 20,
                    right: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: 40,
                        height: 2,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 1
                    }} />
                </div>
            </div>

            {/* 装飾テープ */}
            {!isPreview && (
                <>
                    <div style={{
                        position: 'absolute',
                        top: -8,
                        left: 40,
                        width: 60,
                        height: 20,
                        backgroundColor: 'rgba(255, 235, 180, 0.8)',
                        transform: 'rotate(-15deg)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 10
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: -5,
                        right: 50,
                        width: 50,
                        height: 18,
                        backgroundColor: 'rgba(255, 235, 180, 0.8)',
                        transform: 'rotate(12deg)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 10
                    }} />
                </>
            )}
        </div>
    );
};

export default BackgroundLayer;
