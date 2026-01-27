import React from 'react';
import {
    AbsoluteFill,
    Audio,
    interpolate,
    Sequence,
    spring,
    useCurrentFrame,
    useVideoConfig,
    staticFile,
    Img,
} from 'remotion';
import { AnimeCharacter, Emotion, Action } from './AnimeCharacter';
import { ConcentrationLines, MoodOverlay, ImpactEffect, getShakeStyle, ScreenFlash, SpeedLines, EmblemEffect } from './VisualEffects';

// データ読み込み
import threadDataRaw from '../public/cat_data.json';

interface ThreadItem {
    id: number;
    speaker?: 'metan' | 'zundamon' | 'kanon';
    text?: string;
    audio: string;
    image?: string;
    bg_image?: string;
    duration?: number;
    emotion?: Emotion;
    action?: Action;
    bgm?: string;
}

interface ProcessedItem {
    id: number;
    speaker: 'metan' | 'zundamon' | 'kanon';
    text: string;
    audio: string;
    bg_image: string;
    durationInFrames: number;
    emotion: Emotion;
    action: Action;
    bgm: string;
}

interface Props {
    isPreview?: boolean;
}

export const Shorts: React.FC<Props> = ({ isPreview = false }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // データ処理
    const threadData: ProcessedItem[] = (threadDataRaw as ThreadItem[]).map(item => ({
        id: item.id,
        speaker: item.speaker || 'kanon',
        text: item.text || '',
        audio: item.audio,
        bg_image: item.image || item.bg_image || 'images/bg_thread.jpg',
        durationInFrames: Math.ceil((item.duration || 5) * fps),
        emotion: item.emotion || 'normal',
        action: item.action || 'none',
        bgm: item.bgm || 'bgm/cute_standard.mp3'
    }));

    let cumulativeFrames = 0;
    let currentScene = threadData[0];
    let sceneFrame = 0;

    for (const scene of threadData) {
        if (frame >= cumulativeFrames && frame < cumulativeFrames + scene.durationInFrames) {
            currentScene = scene;
            sceneFrame = frame - cumulativeFrames;
            break;
        }
        cumulativeFrames += scene.durationInFrames;
    }

    const hasPhoto = currentScene.bg_image && currentScene.bg_image !== 'images/bg_thread.jpg';

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* シーンごとの背景BGM制御 */}
            {(() => {
                const bgmSequences: { bgm: string; start: number; duration: number }[] = [];
                let currentPos = 0;

                threadData.forEach((scene) => {
                    const last = bgmSequences[bgmSequences.length - 1];
                    if (last && last.bgm === scene.bgm) {
                        last.duration += scene.durationInFrames;
                    } else {
                        bgmSequences.push({
                            bgm: scene.bgm,
                            start: currentPos,
                            duration: scene.durationInFrames
                        });
                    }
                    currentPos += scene.durationInFrames;
                });

                return bgmSequences.map((seg, idx) => (
                    <Sequence key={`bgm-${idx}`} from={seg.start} durationInFrames={seg.duration}>
                        <Audio src={staticFile(seg.bgm)} volume={0.06} loop />
                    </Sequence>
                ));
            })()}

            {/* 1. コンテンツレイヤー（一番下の階層） */}
            <div style={{ position: 'absolute', inset: 0 }}>
                {/* 背景：部屋 */}
                <AbsoluteFill>
                    <Img
                        src={staticFile('images/bg_kanon_room.png')}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: isPreview ? 'none' : 'blur(10px) brightness(0.7)',
                        }}
                    />
                </AbsoluteFill>

                {/* 写真表示 */}
                {hasPhoto && (
                    <div style={{
                        position: 'absolute',
                        top: 150,
                        left: '10%',
                        width: '80%',
                        zIndex: 200,
                        transform: `scale(${spring({ frame: sceneFrame, fps, config: { damping: 20 } })})`,
                    }}>
                        <div style={{
                            padding: 10,
                            backgroundColor: '#fff',
                            borderRadius: 20,
                            boxShadow: isPreview ? 'none' : '0 15px 40px rgba(0,0,0,0.5)',
                        }}>
                            <Img
                                src={staticFile(currentScene.bg_image)}
                                style={{
                                    width: '100%',
                                    height: 400,
                                    objectFit: 'cover',
                                    borderRadius: 15,
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* メインキャラクター */}
                <div style={{
                    position: 'absolute',
                    bottom: 50,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 100,
                    ...getShakeStyle(sceneFrame,
                        currentScene.emotion === 'panic' ? 4 :
                            currentScene.emotion === 'surprised' && sceneFrame < 15 ? 7 :
                                currentScene.emotion === 'angry' ? 2 : 0
                    )
                }}>
                    <AnimeCharacter
                        type={currentScene.speaker}
                        emotion={currentScene.emotion}
                        action={currentScene.action}
                        frame={sceneFrame}
                        isSpeaking={true}
                        lowQuality={isPreview}
                        style={{ width: 900, height: 1300 }}
                    />
                </div>
            </div>

            {/* 2. 演出エフェクトレイヤー（コンテンツの上に重ねる） */}
            <MoodOverlay emotion={currentScene.emotion} opacity={0.5} />
            {currentScene.emotion === 'panic' && <ConcentrationLines opacity={1.0} />}
            {currentScene.emotion === 'angry' && <SpeedLines opacity={0.9} />}
            {((currentScene.action as string) === 'run' || (currentScene.action as string) === 'run_left' || (currentScene.action as string) === 'run_right') && (
                <SpeedLines opacity={0.9} direction="horizontal" />
            )}

            {currentScene.emotion === 'surprised' && sceneFrame < 15 && (
                <>
                    <ScreenFlash frame={sceneFrame} />
                    <ImpactEffect frame={sceneFrame} />
                </>
            )}

            {/* 漫符（Emblem Effects） */}
            {currentScene.emotion === 'angry' && <EmblemEffect type="angry" frame={sceneFrame} x="70%" y="30%" />}
            {currentScene.emotion === 'panic' && <EmblemEffect type="sweat" frame={sceneFrame} x="75%" y="35%" />}
            {(currentScene.action as string) === 'discovery' || (currentScene.action as string) === 'thinking' ? (
                <EmblemEffect type="lightbulb" frame={sceneFrame} x="50%" y="20%" />
            ) : null}

            {/* 3. 字幕レイヤー（最前面） */}
            <div style={{
                position: 'absolute',
                bottom: 40,
                width: '100%',
                padding: '0 40px',
                zIndex: 1000,
                pointerEvents: 'none'
            }}>
                <div style={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    border: `4px solid ${currentScene.speaker === 'kanon' ? '#00bfff' : '#adff2f'}`,
                    borderRadius: 24,
                    padding: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                }}>
                    <div style={{
                        color: '#fff',
                        fontSize: 48,
                        fontWeight: 900,
                        textAlign: 'center',
                        lineHeight: 1.3,
                        textShadow: '0 4px 10px rgba(0,0,0,0.5)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '125px',
                    }}>
                        {currentScene.text}
                    </div>
                </div>
            </div>

            {/* 音声シーケンス */}
            {
                threadData.reduce((acc, scene) => {
                    const { sequences, cumulativeFrames: cf } = acc;
                    sequences.push(
                        <Sequence key={scene.id} from={cf} durationInFrames={scene.durationInFrames}>
                            <Audio src={staticFile(scene.audio)} />
                        </Sequence>
                    );
                    return { sequences, cumulativeFrames: cf + scene.durationInFrames };
                }, { sequences: [] as React.ReactNode[], cumulativeFrames: 0 }).sequences
            }
        </AbsoluteFill >
    );
};
