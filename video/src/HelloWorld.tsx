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
import threadDataRaw from '../public/lionlop_data.json';

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

const threadData: ProcessedItem[] = (threadDataRaw as ThreadItem[]).map(item => ({
    id: item.id,
    speaker: item.speaker || 'kanon',
    text: item.text || '',
    type: item.type || 'narration',
    comment_text: item.comment_text,
    audio: item.audio,
    bg_image: item.image || item.bg_image || 'images/bg_thread.jpg',  // imageを優先
    durationInFrames: Math.ceil((item.duration || 5) * 30),
    emotion: item.emotion || 'normal'
}));

export const HelloWorld: React.FC = () => {
    const frame = useCurrentFrame();

    // 現在のフレームに該当するシーンを見つける
    let cumulativeFrames = 0;
    let currentScene = threadData[0];
    for (const scene of threadData) {
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
            <TheaterBackground scene={currentScene} />

            {/* キャラクター：二人並んで表示、話者を強調 */}
            <div style={{
                position: 'absolute',
                bottom: 60,
                width: '100%',
                height: 1080 * 0.85,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                padding: '0 100px',
                zIndex: 100,
                pointerEvents: 'none'
            }}>
                {/* カノン（左側） */}
                <div style={{
                    opacity: currentScene.speaker === 'kanon' ? 1 : 0.5,
                    transform: currentScene.speaker === 'kanon' ? 'scale(1.05)' : 'scale(0.95)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease'
                }}>
                    <AnimeCharacter
                        type="kanon"
                        emotion={currentScene.speaker === 'kanon' ? currentScene.emotion : 'normal'}
                        isSpeaking={currentScene.speaker === 'kanon'}
                        style={{
                            width: 550,
                            height: 750,
                        }}
                    />
                </div>

                {/* ずんだもん（右側） */}
                <div style={{
                    opacity: currentScene.speaker === 'zundamon' ? 1 : 0.5,
                    transform: currentScene.speaker === 'zundamon' ? 'scale(1.05)' : 'scale(0.95)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease'
                }}>
                    <AnimeCharacter
                        type="zundamon"
                        emotion={currentScene.speaker === 'zundamon' ? currentScene.emotion : 'normal'}
                        isSpeaking={currentScene.speaker === 'zundamon'}
                        style={{
                            width: 500,
                            height: 700,
                        }}
                    />
                </div>
            </div>

            {/* Text & Audio: タイムラインに沿って切り替え */}
            {threadData.reduce((acc, scene) => {
                const { sequences, cumulativeFrames: cf } = acc;
                sequences.push(
                    <Sequence key={scene.id} from={cf} durationInFrames={scene.durationInFrames}>
                        <TheaterUI scene={scene} />
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

const TheaterBackground: React.FC<{ scene: ProcessedItem }> = ({ scene }) => {
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
                        filter: 'blur(4px) brightness(1.0)',
                        opacity: 1.0
                    }}
                />
            </AbsoluteFill>

            {/* ウサギの写真を中央上部に配置 */}
            {hasPhoto && (
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 120,
                    transform: `translateX(-50%) scale(${photoEntrance}) rotate(-1deg)`,
                    zIndex: 200,
                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))'
                }}>
                    <div style={{
                        padding: 15,
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}>
                        <Img
                            src={staticFile(scene.bg_image)}
                            style={{
                                width: 480,
                                height: 360,
                                objectFit: 'cover',
                                borderRadius: 5,
                                display: 'block'
                            }}
                        />
                        <div style={{
                            marginTop: 10,
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#333',
                            textAlign: 'center',
                            fontFamily: 'serif'
                        }}>
                            📸 ライオンロップイヤー
                        </div>
                    </div>
                </div>
            )}

            {/* Headline Box */}
            <div style={{
                position: 'absolute',
                top: 40,
                left: 40,
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
            }}>
                <div style={{
                    backgroundColor: '#ff0000',
                    color: '#fff',
                    padding: '5px 20px',
                    fontSize: 24,
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
                    padding: '15px 30px',
                    fontSize: 28,
                    fontWeight: 900,
                    borderLeft: '10px solid #ff0000',
                    maxWidth: 500,
                    lineHeight: 1.2
                }}>
                    カノン＆ずんだもんのペット講座 🐰
                </div>
            </div>
        </AbsoluteFill>
    );
};

const TheaterUI: React.FC<{ scene: ProcessedItem }> = ({ scene }) => {
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
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
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
