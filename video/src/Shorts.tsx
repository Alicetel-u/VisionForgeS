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
    audio: string;
    image?: string;
    bg_image?: string;
    duration?: number;
    emotion?: Emotion;
}

interface ProcessedItem {
    id: number;
    speaker: 'metan' | 'zundamon' | 'kanon';
    text: string;
    audio: string;
    bg_image: string;
    durationInFrames: number;
    emotion: Emotion;
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
        emotion: item.emotion || 'normal'
    }));

    let cumulativeFrames = 0;
    let currentScene = threadData[0];
    for (const scene of threadData) {
        if (frame >= cumulativeFrames && frame < cumulativeFrames + scene.durationInFrames) {
            currentScene = scene;
            break;
        }
        cumulativeFrames += scene.durationInFrames;
    }

    const hasPhoto = currentScene.bg_image && currentScene.bg_image !== 'images/bg_thread.jpg';

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* バックグラウンドBGM */}
            <Audio src={staticFile('bgm.mp3')} volume={0.05} loop />

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

            {/* 写真表示（ある場合のみ、上部に大きく表示） */}
            {hasPhoto && (
                <div style={{
                    position: 'absolute',
                    top: 150,
                    left: '10%',
                    width: '80%',
                    zIndex: 200,
                    transform: `scale(${spring({ frame, fps, config: { damping: 20 } })})`,
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

            {/* メインキャラクター：喋っている方を画面中央下に大きく表示 */}
            <div style={{
                position: 'absolute',
                bottom: -50,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                zIndex: 100,
            }}>
                <AnimeCharacter
                    type={currentScene.speaker}
                    emotion={currentScene.emotion}
                    isSpeaking={true}
                    lowQuality={isPreview}
                    style={{
                        width: 800,
                        height: 1200,
                    }}
                />
            </div>

            {/* 縦型専用：巨大な字幕パネル */}
            <div style={{
                position: 'absolute',
                bottom: 120,
                width: '100%',
                padding: '0 40px',
                zIndex: 1000,
                pointerEvents: 'none'
            }}>
                <div style={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(10px)',
                    border: `6px solid ${currentScene.speaker === 'kanon' ? '#00bfff' : '#adff2f'}`,
                    borderRadius: 30,
                    padding: '30px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
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
                        height: '125px', // 1.3 * 48 * 2
                    }}>
                        {currentScene.text}
                    </div>
                </div>
            </div>

            {/* オーディオの切り替え */}
            {threadData.reduce((acc, scene) => {
                const { sequences, cumulativeFrames: cf } = acc;
                sequences.push(
                    <Sequence key={scene.id} from={cf} durationInFrames={scene.durationInFrames}>
                        <Audio src={staticFile(scene.audio)} />
                    </Sequence>
                );
                return { sequences, cumulativeFrames: cf + scene.durationInFrames };
            }, { sequences: [] as React.ReactNode[], cumulativeFrames: 0 }).sequences}
        </AbsoluteFill>
    );
};
