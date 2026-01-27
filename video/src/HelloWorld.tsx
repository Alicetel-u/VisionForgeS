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

// 生成されたニュースデータを読み込む
import newsDataRaw from '../public/news_data.json';

interface NewsItem {
    id: number;
    title: string;
    summary: string;
    audio: string;
    image: string | null;
}

const newsData = newsDataRaw as NewsItem[];

export const HelloWorld: React.FC = () => {
    // 1ニュースあたりの表示時間
    const durationPerItem = 450; // 15秒

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* BGMの追加 */}
            <Audio src={staticFile('bgm.mp3')} volume={0.2} loop />

            {newsData.map((news, index) => {
                return (
                    <Sequence
                        key={news.id}
                        from={index * durationPerItem}
                        durationInFrames={durationPerItem}
                    >
                        <NewsScene news={news} />
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};

const NewsScene: React.FC<{ news: NewsItem }> = ({ news }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 1ニュースあたりの表示時間
    const durationPerItem = 450;

    // エントランスアニメーション
    const entrance = spring({
        frame,
        fps,
        config: { damping: 12 },
    });

    const opacity = interpolate(entrance, [0, 1], [0, 1]);

    // 画像のズームアニメーション (Ken Burns Effect)
    const imageScale = interpolate(frame, [0, durationPerItem], [1, 1.15]);

    // テロップのフェードイン
    const captionOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

    // 結合したテキスト（タイトル + 概要）
    const fullText = `${news.title}　${news.summary}`;

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* 音声の再生 */}
            <Audio src={staticFile(news.audio)} />

            {/* 背景画像（全画面） */}
            <AbsoluteFill style={{ overflow: 'hidden' }}>
                {news.image ? (
                    <Img
                        src={staticFile(news.image)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: `scale(${imageScale})`,
                            opacity: opacity,
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #1a3a5a 0%, #050a10 100%)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 120 }}>NO IMAGE</span>
                    </div>
                )}
                {/* 暗いグラデーションオーバーレイ（テロップを読みやすくする） */}
                <AbsoluteFill
                    style={{
                        background: 'linear-gradient(180deg, transparent 0%, transparent 60%, rgba(0,0,0,0.7) 85%, rgba(0,0,0,0.95) 100%)',
                    }}
                />
            </AbsoluteFill>

            {/* 上部：BREAKING NEWSバッジ */}
            <div
                style={{
                    position: 'absolute',
                    top: 40,
                    left: 40,
                    backgroundColor: '#ff3e3e',
                    color: 'white',
                    padding: '8px 24px',
                    fontSize: 28,
                    fontWeight: 'bold',
                    letterSpacing: '2px',
                    boxShadow: '0 4px 12px rgba(255, 62, 62, 0.5)',
                    transform: `translateX(${interpolate(entrance, [0, 1], [-100, 0])}px)`,
                    opacity: opacity,
                    zIndex: 20,
                }}
            >
                🔴 BREAKING NEWS
            </div>

            {/* 下部：テロップ帯 */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '25%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '0 60px 40px 60px',
                    opacity: captionOpacity,
                    zIndex: 10,
                }}
            >
                {/* テロップテキスト */}
                <div
                    style={{
                        color: '#fff',
                        fontSize: 42,
                        fontWeight: 'bold',
                        lineHeight: 1.4,
                        textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
                        fontFamily: 'sans-serif',
                    }}
                >
                    {/* タイピングアニメーション */}
                    {(() => {
                        const typingStart = 20;
                        const typingSpeed = 2.5; // 文字/フレーム（速度を調整可能）
                        const charsShown = Math.floor(
                            interpolate(
                                frame,
                                [typingStart, durationPerItem - 30],
                                [0, fullText.length],
                                {
                                    extrapolateLeft: 'clamp',
                                    extrapolateRight: 'clamp',
                                }
                            )
                        );
                        return fullText.slice(0, charsShown);
                    })()}
                    {/* 点滅カーソル */}
                    <span
                        style={{
                            display: 'inline-block',
                            width: '4px',
                            height: '36px',
                            backgroundColor: '#ff3e3e',
                            marginLeft: '8px',
                            verticalAlign: 'middle',
                            opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
                        }}
                    />
                </div>

                {/* プログレスバー */}
                <div
                    style={{
                        marginTop: 20,
                        width: '100%',
                        height: 6,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                >
                    <div
                        style={{
                            width: `${(frame / durationPerItem) * 100}%`,
                            height: '100%',
                            backgroundColor: '#ff3e3e',
                            boxShadow: '0 0 15px #ff3e3e',
                            transition: 'width 0.1s linear',
                        }}
                    />
                </div>
            </div>
        </AbsoluteFill>
    );
};
