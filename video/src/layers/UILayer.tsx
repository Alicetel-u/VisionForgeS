/**
 * UILayer - UI統合レイヤー
 * 全てのUIコンポーネントを統合管理
 */

import React from 'react';
import { AbsoluteFill, Audio, staticFile, interpolate } from 'remotion';
import { ProcessedScene } from '../types';
import { TitleBanner } from '../ui/TitleBanner';
import { DialogBox } from '../ui/DialogBox';
import {
    ConcentrationLines,
    MoodOverlay,
    ImpactEffect,
    ScreenFlash,
    SpeedLines,
    EmblemEffect,
    BetaFlash
} from '../VisualEffects';

interface UILayerProps {
    scene: ProcessedScene;
    sceneFrame: number;
    isPreview: boolean;
    isEndingScene: boolean;
}

/**
 * UIレイヤーコンポーネント
 */
export const UILayer: React.FC<UILayerProps> = ({
    scene,
    sceneFrame,
    isPreview,
    isEndingScene
}) => {
    const isClimax = scene.direction?.importance === 'climax';

    return (
        <AbsoluteFill>
            {/* 音声 */}
            <Audio src={staticFile(scene.audio)} />

            {/* 感情オーバーレイ */}
            <MoodOverlay emotion={scene.emotion} opacity={0.5} />

            {/* クライマックスエフェクト */}
            {isClimax && (
                <ClimaxEffect sceneFrame={sceneFrame} isPreview={isPreview} />
            )}

            {/* 感情別エフェクト */}
            <EmotionEffects
                scene={scene}
                sceneFrame={sceneFrame}
            />

            {/* タイトルバナー（エンディング以外） */}
            {!isEndingScene && (
                <TitleBanner
                    title={scene.title || 'カノン＆ずんだもん'}
                    sceneFrame={sceneFrame}
                    isPreview={isPreview}
                />
            )}

            {/* ダイアログボックス */}
            <DialogBox
                text={scene.text}
                speaker={scene.speaker}
                sceneFrame={sceneFrame}
                isPreview={isPreview}
                emphasisWords={scene.emphasis_words}
            />
        </AbsoluteFill>
    );
};

/**
 * クライマックスエフェクト
 * direction.importance === "climax" 時に表示
 * 画面を劇的に演出するインパクトエフェクト
 */
interface ClimaxEffectProps {
    sceneFrame: number;
    isPreview: boolean;
}

const ClimaxEffect: React.FC<ClimaxEffectProps> = ({ sceneFrame, isPreview }) => {
    // 初期フラッシュ（最初の10フレーム）
    const flashOpacity = interpolate(
        sceneFrame,
        [0, 3, 10],
        [0, 1, 0],
        { extrapolateRight: 'clamp' }
    );

    // 衝撃波の拡大
    const shockwaveScale = interpolate(
        sceneFrame,
        [0, 20],
        [0, 3],
        { extrapolateRight: 'clamp' }
    );
    const shockwaveOpacity = interpolate(
        sceneFrame,
        [0, 5, 20],
        [0, 0.8, 0],
        { extrapolateRight: 'clamp' }
    );

    // 集中線の強度
    const linesOpacity = interpolate(
        sceneFrame,
        [5, 15, 60],
        [0, 1, 0.6],
        { extrapolateRight: 'clamp' }
    );

    // ビネット強度
    const vignetteIntensity = interpolate(
        sceneFrame,
        [0, 10, 30],
        [0, 0.7, 0.4],
        { extrapolateRight: 'clamp' }
    );

    // 画面シェイク
    const shakeX = sceneFrame < 20 ? Math.sin(sceneFrame * 3) * (20 - sceneFrame) * 0.3 : 0;
    const shakeY = sceneFrame < 20 ? Math.cos(sceneFrame * 4) * (20 - sceneFrame) * 0.2 : 0;

    // パルス（継続的な強調）
    const pulse = 1 + Math.sin(sceneFrame / 8) * 0.02;

    return (
        <>
            {/* 画面シェイク用ラッパー */}
            <div style={{
                position: 'absolute',
                inset: 0,
                transform: `translate(${shakeX}px, ${shakeY}px) scale(${pulse})`,
                pointerEvents: 'none'
            }}>
                {/* 初期フラッシュ */}
                {flashOpacity > 0.01 && (
                    <AbsoluteFill style={{
                        background: 'linear-gradient(135deg, #fff 0%, #fffacd 50%, #fff 100%)',
                        opacity: flashOpacity,
                        mixBlendMode: 'screen',
                        zIndex: 9500
                    }} />
                )}

                {/* 衝撃波リング */}
                {shockwaveOpacity > 0.01 && (
                    <AbsoluteFill style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9400,
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            border: '4px solid rgba(255,200,100,0.8)',
                            boxShadow: isPreview ? 'none' : `
                                0 0 30px rgba(255,200,100,0.6),
                                0 0 60px rgba(255,150,50,0.4),
                                inset 0 0 30px rgba(255,200,100,0.3)
                            `,
                            transform: `scale(${shockwaveScale})`,
                            opacity: shockwaveOpacity
                        }} />
                    </AbsoluteFill>
                )}

                {/* 放射状集中線 */}
                {linesOpacity > 0.01 && !isPreview && (
                    <AbsoluteFill style={{
                        opacity: linesOpacity,
                        zIndex: 9300,
                        overflow: 'hidden'
                    }}>
                        {/* 中央から放射状に広がる線 */}
                        {Array.from({ length: 24 }).map((_, i) => {
                            const angle = (i / 24) * 360;
                            const delay = i * 0.5;
                            const lineLength = interpolate(
                                Math.max(0, sceneFrame - delay),
                                [0, 15],
                                [0, 1],
                                { extrapolateRight: 'clamp' }
                            );
                            return (
                                <div
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        width: `${150 * lineLength}%`,
                                        height: 3,
                                        background: `linear-gradient(90deg, transparent 0%, rgba(255,200,100,${0.4 + Math.sin(sceneFrame / 5 + i) * 0.2}) 30%, transparent 100%)`,
                                        transformOrigin: 'left center',
                                        transform: `rotate(${angle}deg)`,
                                        opacity: 0.7
                                    }}
                                />
                            );
                        })}
                    </AbsoluteFill>
                )}

                {/* 強化ビネット */}
                {vignetteIntensity > 0.01 && (
                    <AbsoluteFill style={{
                        background: `radial-gradient(
                            ellipse 80% 70% at 50% 50%,
                            transparent 30%,
                            rgba(0, 0, 0, ${vignetteIntensity * 0.3}) 60%,
                            rgba(0, 0, 0, ${vignetteIntensity * 0.7}) 100%
                        )`,
                        zIndex: 9200,
                        pointerEvents: 'none'
                    }} />
                )}

                {/* 色収差エフェクト（上下のカラーバンド） */}
                {sceneFrame < 30 && !isPreview && (
                    <>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: 'linear-gradient(90deg, rgba(255,0,0,0.3), rgba(0,255,255,0.3))',
                            opacity: interpolate(sceneFrame, [0, 5, 30], [0, 0.8, 0], { extrapolateRight: 'clamp' }),
                            zIndex: 9600
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: 'linear-gradient(90deg, rgba(0,255,255,0.3), rgba(255,0,0,0.3))',
                            opacity: interpolate(sceneFrame, [0, 5, 30], [0, 0.8, 0], { extrapolateRight: 'clamp' }),
                            zIndex: 9600
                        }} />
                    </>
                )}

                {/* コーナーフレア */}
                {!isPreview && (
                    <>
                        <div style={{
                            position: 'absolute',
                            top: -50,
                            left: -50,
                            width: 200,
                            height: 200,
                            background: `radial-gradient(circle, rgba(255,200,100,${0.3 + Math.sin(sceneFrame / 10) * 0.15}) 0%, transparent 70%)`,
                            opacity: interpolate(sceneFrame, [10, 30], [0, 1], { extrapolateRight: 'clamp' }),
                            zIndex: 9100
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: -50,
                            right: -50,
                            width: 200,
                            height: 200,
                            background: `radial-gradient(circle, rgba(255,100,100,${0.3 + Math.sin(sceneFrame / 12) * 0.15}) 0%, transparent 70%)`,
                            opacity: interpolate(sceneFrame, [15, 35], [0, 1], { extrapolateRight: 'clamp' }),
                            zIndex: 9100
                        }} />
                    </>
                )}
            </div>
        </>
    );
};

/**
 * 感情に応じたエフェクト群
 */
interface EmotionEffectsProps {
    scene: ProcessedScene;
    sceneFrame: number;
}

const EmotionEffects: React.FC<EmotionEffectsProps> = ({ scene, sceneFrame }) => {
    const { emotion, action, speaker } = scene;

    // 話者の位置に応じたエフェクト配置
    const effectX = speaker === 'kanon' ? '30%' : '70%';
    const emblemX = speaker === 'kanon' ? '25%' : '75%';

    return (
        <>
            {/* パニック時の集中線 */}
            {emotion === 'panic' && <ConcentrationLines opacity={1.0} />}

            {/* 怒り時のスピード線 */}
            {emotion === 'angry' && <SpeedLines opacity={0.9} />}

            {/* 走りアクション時のスピード線 */}
            {(action === 'run' || action === 'run_left' || action === 'run_right') && (
                <SpeedLines opacity={0.9} direction="horizontal" />
            )}

            {/* 驚き時のフラッシュ＆衝撃波 */}
            {emotion === 'surprised' && sceneFrame < 15 && (
                <>
                    <ScreenFlash frame={sceneFrame} />
                    <ImpactEffect frame={sceneFrame} />
                </>
            )}

            {/* パニック時のベタフラッシュ */}
            {emotion === 'panic' && sceneFrame < 25 && (
                <BetaFlash frame={sceneFrame} opacity={0.7} />
            )}

            {/* 怒りマーク */}
            {emotion === 'angry' && (
                <EmblemEffect
                    type="angry"
                    frame={sceneFrame}
                    x={effectX}
                    y="25%"
                />
            )}

            {/* 汗マーク */}
            {emotion === 'panic' && (
                <EmblemEffect
                    type="sweat"
                    frame={sceneFrame}
                    x={speaker === 'kanon' ? '35%' : '75%'}
                    y="30%"
                />
            )}

            {/* 発見・思考時の電球 */}
            {(action === 'discovery' || action === 'thinking') && (
                <EmblemEffect
                    type="lightbulb"
                    frame={sceneFrame}
                    x={emblemX}
                    y="15%"
                />
            )}
        </>
    );
};

export default UILayer;
