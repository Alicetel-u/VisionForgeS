import React from 'react';
import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';

export const HelloWorld: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // 背景のグラデーションアニメーション
    const rotation = interpolate(frame, [0, 150], [0, 360]);
    const gradientScale = interpolate(
        Math.sin(frame / 20),
        [-1, 1],
        [1, 1.2]
    );

    // タイトルのスプリングアニメーション
    const entrance = spring({
        frame,
        fps,
        config: {
            damping: 10,
        },
    });

    const scale = interpolate(entrance, [0, 1], [0.8, 1]);
    const opacity = interpolate(entrance, [0, 1], [0, 1]);

    // パーティクルの配置データ（シミュレーション）
    const particles = Array.from({ length: 15 }).map((_, i) => {
        const seed = i * 123.45;
        const x = (Math.sin(seed) * 0.5 + 0.5) * width;
        const y = (Math.cos(seed) * 0.5 + 0.5) * height;
        const offset = Math.sin((frame + i * 10) / 30) * 50;
        return { x, y: y + offset, size: 10 + (i % 5) * 10 };
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: '#0a0a0a',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            {/* 背景グラデーション */}
            <AbsoluteFill
                style={{
                    background: `conic-gradient(from ${rotation}deg at 50% 50%, #ff8c00, #ff0080, #7928ca, #ff8c00)`,
                    filter: 'blur(100px)',
                    opacity: 0.4,
                    transform: `scale(${gradientScale})`,
                }}
            />

            {/* パーティクル層 */}
            {particles.map((p, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        left: p.x,
                        top: p.y,
                        width: p.size,
                        height: p.size,
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        opacity: 0.15,
                        filter: 'blur(5px)',
                    }}
                />
            ))}

            {/* メインコンテンツ */}
            <AbsoluteFill
                style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    scale: String(scale),
                    opacity: String(opacity),
                }}
            >
                <h1
                    style={{
                        color: 'white',
                        fontSize: 160,
                        fontWeight: 900,
                        margin: 0,
                        letterSpacing: '-0.05em',
                        textShadow: '0 0 40px rgba(255, 255, 255, 0.3)',
                    }}
                >
                    Vision<span style={{ color: '#ff8c00' }}>Forge</span>
                </h1>
                <p
                    style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: 40,
                        marginTop: 20,
                        fontWeight: 300,
                        letterSpacing: '0.4em',
                        textTransform: 'uppercase',
                    }}
                >
                    Automated Video Production
                </p>
            </AbsoluteFill>

            {/* プログレスバー */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 60,
                    left: '10%',
                    width: '80%',
                    height: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 3,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${(frame / 150) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #ff8c00, #ff0080)',
                        boxShadow: '0 0 10px #ff0080',
                    }}
                />
            </div>
        </AbsoluteFill>
    );
};
