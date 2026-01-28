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
import { ConcentrationLines, MoodOverlay, ImpactEffect, getShakeStyle, ScreenFlash, SpeedLines, EmblemEffect, BetaFlash } from './VisualEffects';
import { Ending } from './components/Ending';

// データ読み込み
import threadDataRaw from '../public/cat_data.json';

interface ThreadItem {
    id: number;
    speaker?: 'metan' | 'zundamon' | 'kanon';
    text?: string;
    type?: 'narration' | 'comment';
    comment_text?: string;
    audio: string;
    bg_image?: string;
    image?: string;  // lionlop_data.jsonで使用
    duration?: number;
    emotion?: Emotion;
    action?: Action;
    title?: string;
    bgm?: string;
}

interface ProcessedItem {
    id: number;
    speaker: 'metan' | 'zundamon' | 'kanon';
    text: string;
    type: 'narration' | 'comment';
    comment_text?: string;
    audio: string;
    bg_image: string;
    durationInFrames: number;
    emotion: Emotion;
    action: Action;
    bgm: string;
    title?: string;
}

interface Props {
    isPreview?: boolean;
}

export const HelloWorld: React.FC<Props> = ({ isPreview = false }) => {
    const frame = useCurrentFrame();
    const { fps, width } = useVideoConfig();

    // プレビュー解像度(1280x720)を基準としたスケール計算
    // これにより、出力解像度が変わっても見た目のバランスが維持されます
    const baseWidth = 1280;
    const scale = width / baseWidth;

    // 現在のフレームに該当するシーンを見つける
    let lastBgm = 'bgm/bgm_cute_main.mp3';
    const threadDataForConfig: ProcessedItem[] = (threadDataRaw as unknown as ThreadItem[]).map(item => {
        if (item.bgm) {
            lastBgm = item.bgm;
        }
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
            bgm: lastBgm,
            title: item.title
        };
    });

    let cumulativeFrames = 0;
    let currentScene = threadDataForConfig[0];
    let sceneFrame = 0;
    for (const scene of threadDataForConfig) {
        if (frame >= cumulativeFrames && frame < cumulativeFrames + scene.durationInFrames) {
            currentScene = scene;
            sceneFrame = frame - cumulativeFrames;
            break;
        }
        cumulativeFrames += scene.durationInFrames;
    }

    const endingTalkStartFrame = threadDataForConfig.length > 4
        ? threadDataForConfig.slice(0, -4).reduce((acc, s) => acc + s.durationInFrames, 0)
        : 0;

    return (
        <AbsoluteFill style={{ backgroundColor: '#050505', color: '#fff', fontFamily: 'Inter, "Noto Sans JP", sans-serif' }}>
            {/* スケール適用コンテナ：中身をプレビューと同じバランスで拡大する */}
            <div style={{
                width: baseWidth,
                height: 720,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0
            }}>
                {/* 修正版BGM制御ロジック */}
                {(() => {
                    return (
                        <>
                            <Sequence from={0} durationInFrames={endingTalkStartFrame}>
                                <Audio src={staticFile('bgm/bgm_cute_main.mp3')} volume={0.15} loop />
                            </Sequence>
                            <Sequence from={endingTalkStartFrame}>
                                <Audio src={staticFile('bgm/電脳キャンディ★ガール.mp3')} volume={0.15} loop />
                            </Sequence>
                        </>
                    );
                })()}

                {/* 1. 本編コンテンツ */}
                <Sequence from={0} durationInFrames={threadDataForConfig.reduce((acc, s) => acc + s.durationInFrames, 0)}>
                    <AbsoluteFill>
                        <div style={{ position: 'absolute', inset: 0 }}>
                            <TheaterBackground scene={currentScene} isPreview={isPreview} />

                            {/* キャラクター：プレビュー時と全く同じpx指定 */}
                            <div style={{
                                position: 'absolute',
                                bottom: -30,
                                width: '100%',
                                height: 720 * 0.9,
                                display: 'flex',
                                justifyContent: currentScene.id < 13 ? 'space-between' : 'center',
                                alignItems: 'flex-end',
                                padding: currentScene.id < 13 ? '0 10px' : '0',
                                gap: currentScene.id < 13 ? 0 : 100,
                                zIndex: 100,
                                pointerEvents: 'none',
                                ...getShakeStyle(sceneFrame,
                                    currentScene.emotion === 'panic' ? 4 :
                                        currentScene.emotion === 'surprised' && sceneFrame < 15 ? 7 :
                                            currentScene.emotion === 'angry' ? 2 : 0
                                )
                            }}>
                                {/* カノン（左側） */}
                                <div style={{
                                    transform: currentScene.id < 13 && currentScene.speaker === 'kanon' ? 'scale(1.05) translateY(0px)' : 'scale(1.0) translateY(10px)',
                                    filter: `drop-shadow(4px 0 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(0 -4px 0 white) ${(currentScene.id >= 13 || currentScene.speaker === 'kanon') ? 'brightness(1)' : 'brightness(0.85) grayscale(0.1)'}`,
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}>
                                    <AnimeCharacter
                                        type="kanon"
                                        emotion={currentScene.speaker === 'kanon' ? currentScene.emotion : 'normal'}
                                        action={currentScene.speaker === 'kanon' ? currentScene.action : 'none'}
                                        frame={sceneFrame}
                                        isSpeaking={currentScene.speaker === 'kanon'}
                                        lowQuality={isPreview}
                                        style={{ width: 460, height: 640 }}
                                    />
                                </div>

                                {/* ずんだもん（右側） */}
                                <div style={{
                                    transform: currentScene.id < 13 && currentScene.speaker === 'zundamon' ? 'scale(1.05) translateY(0px)' : 'scale(1.0) translateY(10px)',
                                    filter: `drop-shadow(4px 0 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(0 -4px 0 white) ${(currentScene.id >= 13 || currentScene.speaker === 'zundamon') ? 'brightness(1)' : 'brightness(0.85) grayscale(0.1)'}`,
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}>
                                    <AnimeCharacter
                                        type="zundamon"
                                        emotion={currentScene.speaker === 'zundamon' ? currentScene.emotion : 'normal'}
                                        action={currentScene.speaker === 'zundamon' ? currentScene.action : 'none'}
                                        frame={sceneFrame}
                                        isSpeaking={currentScene.speaker === 'zundamon'}
                                        lowQuality={isPreview}
                                        style={{ width: 500, height: 700 }}
                                    />
                                </div>
                            </div>
                        </div>

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
                        {currentScene.emotion === 'panic' && sceneFrame < 25 && <BetaFlash frame={sceneFrame} opacity={0.7} />}
                        {currentScene.emotion === 'angry' && <EmblemEffect type="angry" frame={sceneFrame} x={currentScene.speaker === 'kanon' ? '30%' : '70%'} y="25%" />}
                        {currentScene.emotion === 'panic' && <EmblemEffect type="sweat" frame={sceneFrame} x={currentScene.speaker === 'kanon' ? '35%' : '75%'} y="30%" />}
                        {((currentScene.action as string) === 'discovery' || (currentScene.action as string) === 'thinking') && (
                            <EmblemEffect type="lightbulb" frame={sceneFrame} x={currentScene.speaker === 'kanon' ? '25%' : '75%'} y="15%" />
                        )}

                        {threadDataForConfig.reduce((acc, scene, idx) => {
                            const { sequences, cumulativeFrames: cf } = acc;
                            sequences.push(
                                <Sequence key={`${scene.id}-${idx}`} from={cf} durationInFrames={scene.durationInFrames}>
                                    <TheaterUI scene={scene} isPreview={isPreview} />
                                </Sequence>
                            );
                            return {
                                sequences,
                                cumulativeFrames: cf + scene.durationInFrames
                            };
                        }, { sequences: [] as React.ReactNode[], cumulativeFrames: 0 }).sequences}
                    </AbsoluteFill>
                </Sequence>
            </div>
        </AbsoluteFill>
    );
};

const TheaterBackground: React.FC<{ scene: ProcessedItem; isPreview: boolean }> = ({ scene, isPreview }) => {
    const frame = useCurrentFrame();
    const bgScale = 1.0; // 動きを停止（固定スケール）

    const isEndingPart = scene.id >= 13;
    const bgImage = isEndingPart ? (scene.bg_image || 'images/bg_ending_neon.jpg') : 'images/bg_kanon_room.png';

    return (
        <AbsoluteFill>
            <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}>
                <Img
                    src={staticFile(bgImage)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `scale(${bgScale})`,
                        filter: isPreview ? 'none' : (isEndingPart ? 'brightness(0.9)' : 'blur(4px) brightness(1.0)'),
                        opacity: 1.0
                    }}
                />
            </AbsoluteFill>

            {!isEndingPart && scene.bg_image && scene.bg_image !== 'images/bg_thread.jpg' && (
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 60,
                    transform: `translateX(-50%) rotate(-1.5deg)`,
                    zIndex: 50,
                    filter: isPreview ? 'none' : 'drop-shadow(0 25px 50px rgba(0,0,0,0.6))'
                }}>
                    <div style={{
                        padding: '12px 12px 12px 12px',
                        backgroundColor: '#fff',
                        borderRadius: 4,
                        boxShadow: isPreview ? 'none' : 'inset 0 0 10px rgba(0,0,0,0.1)',
                        border: '1px solid #ddd'
                    }}>
                        <div style={{ overflow: 'hidden', borderRadius: 2 }}>
                            <Img
                                src={staticFile(scene.bg_image)}
                                style={{
                                    width: 520,
                                    height: 340,
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </AbsoluteFill>
    );
};

const TheaterUI: React.FC<{ scene: ProcessedItem; isPreview: boolean }> = ({ scene, isPreview }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const speakerInfo = scene.speaker === 'kanon'
        ? { name: 'かのん', color: '#00bfff' }
        : { name: 'ずんだもん', color: '#adff2f' };

    return (
        <AbsoluteFill>
            <Audio src={staticFile(scene.audio)} />

            <div style={{
                position: 'absolute',
                bottom: 20,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                zIndex: 1500,
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'relative',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: `6px solid ${speakerInfo.color}`,
                    borderRadius: 25,
                    padding: '15px 50px',
                    width: '85%',
                    minHeight: 162,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: isPreview ? 'none' : '0 10px 30px rgba(0,0,0,0.3)',
                    transform: `scale(${spring({ frame, fps, config: { damping: 15 } })})`,
                }}>
                    <div style={{
                        position: 'absolute',
                        top: -45,
                        left: 40,
                        backgroundColor: speakerInfo.color,
                        color: scene.speaker === 'zundamon' ? '#000' : '#fff',
                        padding: '5px 30px',
                        borderRadius: '15px 15px 0 0',
                        fontSize: 28,
                        fontWeight: 900,
                    }}>
                        {speakerInfo.name}
                    </div>

                    <div style={{
                        fontSize: 40,
                        fontWeight: 900,
                        color: '#222',
                        textAlign: 'left',
                        lineHeight: 1.15,
                        overflow: 'hidden',
                        wordBreak: 'break-all',
                        letterSpacing: '-0.5px',
                    }}>
                        {scene.text}
                    </div>
                </div>
            </div>

            <div style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: 300,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                zIndex: 1400,
                pointerEvents: 'none'
            }} />

            {scene.id < 13 && (
                <div style={{
                    position: 'absolute',
                    top: 40,
                    left: 40,
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column',
                    filter: isPreview ? 'none' : 'drop-shadow(0 15px 25px rgba(0,0,0,0.4))',
                    opacity: 1,
                }}>
                    <div style={{
                        background: 'rgba(15, 15, 15, 0.8)',
                        backdropFilter: 'blur(12px)',
                        color: '#fff',
                        padding: '15px 30px',
                        fontSize: 28,
                        fontWeight: 900,
                        borderLeft: '12px solid #ff3b30',
                        borderRadius: '12px',
                        maxWidth: 600,
                        lineHeight: 1.2,
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        {scene.title || 'カノン＆ずんだもん'}
                    </div>
                </div>
            )}
        </AbsoluteFill>
    );
};
