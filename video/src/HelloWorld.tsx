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
import { AnimeCharacter, Emotion } from './AnimeCharacter';

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
    title?: string;
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
}

interface Props {
    isPreview?: boolean;
}

export const HelloWorld: React.FC<Props> = ({ isPreview = false }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 現在のフレームに該当するシーンを見つける
    const threadDataForConfig: ProcessedItem[] = (threadDataRaw as ThreadItem[]).map(item => ({
        id: item.id,
        speaker: item.speaker || 'kanon',
        text: item.text || '',
        type: item.type || 'narration',
        comment_text: item.comment_text,
        audio: item.audio,
        bg_image: item.image || item.bg_image || 'images/bg_thread.jpg',
        durationInFrames: Math.ceil((item.duration || 5) * fps),
        emotion: item.emotion || 'normal'
    }));

    let cumulativeFrames = 0;
    let currentScene = threadDataForConfig[0];
    for (const scene of threadDataForConfig) {
        if (frame >= cumulativeFrames && frame < cumulativeFrames + scene.durationInFrames) {
            currentScene = scene;
            break;
        }
        cumulativeFrames += scene.durationInFrames;
    }

    // 写真があるシーンかどうかをチェック
    const hasPhoto = currentScene.bg_image && currentScene.bg_image !== 'images/bg_thread.jpg';

    return (
        <AbsoluteFill style={{ backgroundColor: '#050505', color: '#fff', fontFamily: 'Inter, "Noto Sans JP", sans-serif' }}>
            {/* Ambient Background Music */}
            <Audio src={staticFile('bgm.mp3')} volume={0.05} loop />

            {/* Background & Base Layers */}
            <TheaterBackground scene={currentScene} isPreview={isPreview} />

            {/* キャラクター：二人並んで表示、話者を強調 */}
            {/* ... (existing character logic) */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                width: '100%',
                height: 1080 * 0.9,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                padding: '0 20px',
                zIndex: 100,
                pointerEvents: 'none'
            }}>
                {/* カノン（左側） */}
                <div style={{
                    opacity: currentScene.speaker === 'kanon' ? 1 : 0.8,
                    transform: currentScene.speaker === 'kanon' ? 'scale(1.02)' : 'scale(0.98)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease'
                }}>
                    <AnimeCharacter
                        type="kanon"
                        emotion={currentScene.speaker === 'kanon' ? currentScene.emotion : 'normal'}
                        isSpeaking={currentScene.speaker === 'kanon'}
                        lowQuality={isPreview}
                        style={{
                            width: 520,
                            height: 720,
                        }}
                    />
                </div>

                {/* ずんだもん（右側） */}
                <div style={{
                    opacity: currentScene.speaker === 'zundamon' ? 1 : 0.8,
                    transform: currentScene.speaker === 'zundamon' ? 'scale(1.02)' : 'scale(0.98)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease'
                }}>
                    <AnimeCharacter
                        type="zundamon"
                        emotion={currentScene.speaker === 'zundamon' ? currentScene.emotion : 'normal'}
                        isSpeaking={currentScene.speaker === 'zundamon'}
                        lowQuality={isPreview}
                        style={{
                            width: 480,
                            height: 680,
                        }}
                    />
                </div>
            </div>

            {/* Text & Audio: タイムラインに沿って切り替え */}
            {threadDataForConfig.reduce((acc, scene) => {
                const { sequences, cumulativeFrames: cf } = acc;
                sequences.push(
                    <Sequence key={scene.id} from={cf} durationInFrames={scene.durationInFrames}>
                        <TheaterUI scene={scene} isPreview={isPreview} />
                    </Sequence>
                );
                return {
                    sequences,
                    cumulativeFrames: cf + scene.durationInFrames
                };
            }, { sequences: [] as React.ReactNode[], cumulativeFrames: 0 }).sequences}
        </AbsoluteFill>
    );
};

const TheaterBackground: React.FC<{ scene: ProcessedItem; isPreview: boolean }> = ({ scene, isPreview }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const bgScale = interpolate(frame % 300, [0, 300], [1.02, 1.05]);

    // 写真があるかどうか
    const hasPhoto = scene.bg_image && scene.bg_image !== 'images/bg_thread.jpg';
    const photoEntrance = spring({ frame, fps, config: { damping: 20, mass: 0.5 } });

    return (
        <AbsoluteFill>
            {/* 常に部屋の背景を表示 */}
            <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#fdfbf7' }}>
                <Img
                    src={staticFile('images/bg_kanon_room.png')}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `scale(${bgScale})`,
                        filter: isPreview ? 'none' : 'blur(4px) brightness(1.0)',
                        opacity: 1.0
                    }}
                />
            </AbsoluteFill>

            {/* ウサギの写真を中央上部に配置 */}
            {hasPhoto && (
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 50,
                    transform: `translateX(-50%) scale(${photoEntrance}) rotate(-0.5deg)`,
                    zIndex: 200,
                    filter: isPreview ? 'none' : 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))'
                }}>
                    <div style={{
                        padding: 15,
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        boxShadow: isPreview ? 'none' : '0 10px 30px rgba(0,0,0,0.3)'
                    }}>
                        <Img
                            src={staticFile(scene.bg_image)}
                            style={{
                                width: 440,
                                height: 330,
                                objectFit: 'cover',
                                borderRadius: 5,
                                display: 'block'
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Headline Box */}
            <div style={{
                position: 'absolute',
                top: 25,
                left: 25,
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                filter: isPreview ? 'none' : 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
            }}>
                <div style={{
                    backgroundColor: '#ff0000',
                    color: '#fff',
                    padding: '3px 15px',
                    fontSize: 18,
                    fontWeight: 900,
                    width: 'fit-content',
                    borderRadius: '5px 5px 0 0',
                    letterSpacing: 2
                }}>
                    PET CHANNEL
                </div>
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    color: '#fff',
                    padding: '10px 25px',
                    fontSize: 22,
                    fontWeight: 900,
                    borderLeft: '8px solid #ff0000',
                    maxWidth: 450,
                    lineHeight: 1.2
                }}>
                    カノン＆ずんだもんのネコ講座 🐱
                </div>
            </div>
        </AbsoluteFill>
    );
};

const TheaterUI: React.FC<{ scene: ProcessedItem; isPreview: boolean }> = ({ scene, isPreview }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const commentEntrance = spring({ frame, fps, config: { damping: 15 } });

    // 話者の名前と色
    const speakerInfo = scene.speaker === 'kanon'
        ? { name: 'KANON', color: '#00bfff' }
        : { name: 'ZUNDAMON', color: '#adff2f' };

    return (
        <AbsoluteFill>
            <Audio src={staticFile(scene.audio)} />

            {/* Subtitles */}
            <div style={{
                position: 'absolute',
                bottom: 40,
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
                    padding: '25px 50px',
                    width: '80%',
                    minHeight: 100,
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
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '112px', // lineHeight(1.4) * fontSize(40) * 2 lines
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
        </AbsoluteFill>
    );
};
