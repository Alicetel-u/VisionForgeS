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
import threadDataRaw from '../public/news_data.json';

interface ThreadItem {
    id: number;
    speaker?: 'metan' | 'zundamon' | 'kanon';
    text?: string;
    type?: 'narration' | 'comment';
    comment_text?: string;
    audio: string;
    bg_image?: string;
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
    bg_image: item.bg_image || 'images/bg_thread.jpg',
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

    return (
        <AbsoluteFill style={{ backgroundColor: '#050505', color: '#fff', fontFamily: 'Inter, "Noto Sans JP", sans-serif' }}>
            {/* Ambient Background Music */}
            <Audio src={staticFile('bgm.mp3')} volume={0.05} loop />

            {/* Background & Base Layers */}
            <TheaterBackground scene={currentScene} />

            {/* Character: 動画の最初から最後まで常に表示 */}
            <div style={{
                position: 'absolute',
                bottom: 100,
                width: '100%',
                height: 1080 * 0.8,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                padding: '0 50px',
                zIndex: 100,
                pointerEvents: 'none'
            }}>
                <AnimeCharacter
                    type="kanon"
                    emotion={currentScene.emotion}
                    isSpeaking={true} // 常に居るが、声に合わせて微動だにする
                    style={{
                        width: 650,
                        height: 850,
                        filter: 'drop-shadow(4px 4px 0px #000) drop-shadow(-4px -4px 0px #000) drop-shadow(4px -4px 0px #000) drop-shadow(-4px 4px 0px #000)',
                        transform: `scale(1.1)`,
                    }}
                />
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
    const bgScale = interpolate(frame % 300, [0, 300], [1.02, 1.05]);

    return (
        <AbsoluteFill>
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
                    KANON NEWS
                </div>
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    color: '#fff',
                    padding: '15px 30px',
                    fontSize: 32,
                    fontWeight: 900,
                    borderLeft: '10px solid #ff0000',
                    maxWidth: 600,
                    lineHeight: 1.2
                }}>
                    【最新】ゲーム業界のホットニュースをお届け！
                </div>
            </div>
        </AbsoluteFill>
    );
};

const TheaterUI: React.FC<{ scene: ProcessedItem }> = ({ scene }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const commentEntrance = spring({ frame, fps, config: { damping: 15 } });

    return (
        <AbsoluteFill>
            <Audio src={staticFile(scene.audio)} />

            {/* 5ch Layout Comment Box */}
            {scene.type === 'comment' && (
                <div style={{
                    position: 'absolute',
                    top: height * 0.45,
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${commentEntrance})`,
                    width: width * 0.55,
                    background: '#efefef',
                    border: '1px solid #ccc',
                    boxShadow: '10px 10px 0 rgba(0,0,0,0.2)',
                    zIndex: 500,
                }}>
                    <div style={{
                        backgroundColor: '#e5edff',
                        padding: '10px 20px',
                        borderBottom: '1px solid #ccc',
                        color: '#333',
                        fontSize: 22,
                        fontWeight: 'bold',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>名無しさん@VisionForge</span>
                        <span style={{ color: '#0066cc' }}>&gt;&gt; レスをみる</span>
                    </div>
                    <div style={{ padding: '30px 40px', color: '#000', fontSize: 40, fontWeight: 900, lineHeight: 1.5 }}>
                        {scene.comment_text}
                    </div>
                </div>
            )}

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
                    border: '6px solid #00bfff',
                    borderRadius: 25,
                    padding: '25px 50px',
                    width: '90%',
                    minHeight: 120,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    transform: `scale(${spring({ frame, fps, config: { damping: 15 } })})`,
                }}>
                    <div style={{
                        position: 'absolute',
                        top: -45,
                        left: 40,
                        backgroundColor: '#00bfff',
                        color: '#fff',
                        padding: '5px 30px',
                        borderRadius: '15px 15px 0 0',
                        fontSize: 28,
                        fontWeight: 900,
                    }}>
                        KANON
                    </div>

                    <div style={{
                        fontSize: 44,
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
