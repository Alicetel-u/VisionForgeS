import React from 'react';
import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
    staticFile,
    Img,
} from 'remotion';
import { AnimeCharacter } from '../AnimeCharacter';

export const Ending: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 登場アニメーション
    const entrance = spring({
        frame,
        fps,
        config: {
            damping: 15,
            stiffness: 100,
        },
    });

    // パーティクルの動き（簡易実装）
    const particles = new Array(12).fill(0).map((_, i) => {
        const x = (i * 100) % 1920;
        const delay = i * 5;
        const opacity = interpolate(frame - delay, [0, 30, 90], [0, 0.6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const translateY = interpolate(frame - delay, [0, 150], [0, -400], { extrapolateLeft: 'clamp' });
        return { x, translateY, opacity, content: i % 2 === 0 ? '✨' : '🎵' };
    });

    return (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
            {/* 新しいネオン背景画像 */}
            <AbsoluteFill>
                <Img
                    src={staticFile('images/bg_ending_neon.jpg')}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.7)',
                    }}
                />
            </AbsoluteFill>

            {/* 背景の柔らかいオーバーレイ */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%)',
                zIndex: 1,
            }} />

            {/* パーティクル */}
            {particles.map((p, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    left: p.x,
                    bottom: 100,
                    fontSize: 30,
                    opacity: p.opacity,
                    transform: `translateY(${p.translateY}px)`,
                    zIndex: 2,
                    pointerEvents: 'none',
                }}>
                    {p.content}
                </div>
            ))}

            {/* アイリス効果（外側のぼかし） */}
            <div style={{
                position: 'absolute',
                inset: -200,
                border: '600px solid black',
                borderRadius: '50%',
                opacity: 0.2,
                zIndex: 5,
                pointerEvents: 'none',
                transform: `scale(${interpolate(frame, [0, 30], [1.5, 1], { extrapolateRight: 'clamp' })})`,
            }} />

            {/* キャラクター（中央寄り） */}
            <div style={{
                position: 'absolute',
                bottom: -40,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                gap: 80,
                zIndex: 10,
            }}>
                {/* かのん */}
                <div style={{
                    transform: `translateY(${(1 - entrance) * 600}px)`,
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))',
                }}>
                    <AnimeCharacter
                        type="kanon"
                        emotion="happy"
                        action="none"
                        frame={frame}
                        isSpeaking={false}
                        style={{ width: 500, height: 700 }}
                    />
                </div>

                {/* ずんだもん */}
                <div style={{
                    transform: `translateY(${(1 - entrance) * 600}px)`,
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))',
                }}>
                    <AnimeCharacter
                        type="zundamon"
                        emotion="happy"
                        action="none"
                        frame={frame}
                        isSpeaking={false}
                        style={{ width: 540, height: 740 }}
                    />
                </div>
            </div>
        </AbsoluteFill>
    );
};
