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
    const durationPerItem = 210;

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
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
    const durationPerItem = 210;

    // エントランスアニメーション
    const entrance = spring({
        frame,
        fps,
        config: { damping: 12 },
    });

    const opacity = interpolate(entrance, [0, 1], [0, 1]);

    // 画像のズームアニメーション (Ken Burns Effect)
    const imageScale = interpolate(frame, [0, 210], [1, 1.2]);

    return (
        <AbsoluteFill style={{ flexDirection: 'row', display: 'flex' }}>
            {/* 音声の再生 */}
            <Audio src={staticFile(news.audio)} />

            {/* 左側：画像セクション */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', backgroundColor: '#1a1a1a' }}>
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
                        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 100 }}>NO IMAGE</span>
                    </div>
                )}
                <AbsoluteFill style={{ background: 'linear-gradient(90deg, transparent 70%, rgba(0,0,0,1) 100%)' }} />
            </div>

            {/* 右側：テキストセクション */}
            <div
                style={{
                    width: '45%',
                    backgroundColor: '#000',
                    padding: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    borderLeft: '4px solid #ff3e3e',
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        backgroundColor: '#ff3e3e',
                        color: 'white',
                        padding: '5px 20px',
                        fontSize: 24,
                        fontWeight: 'bold',
                        marginBottom: 30,
                        width: 'fit-content',
                        transform: `translateX(${interpolate(entrance, [0, 1], [-50, 0])}px)`,
                        opacity: opacity
                    }}
                >
                    BREAKING NEWS
                </div>

                <div style={{ opacity: opacity, transform: `translateY(${interpolate(entrance, [0, 1], [30, 0])}px)` }}>
                    <h2
                        style={{
                            color: '#fff',
                            fontSize: 64,
                            fontWeight: 900,
                            marginBottom: 40,
                            lineHeight: 1.2,
                        }}
                    >
                        {news.title}
                    </h2>

                    <div
                        style={{
                            color: '#bbb',
                            fontSize: 32,
                            lineHeight: 1.6,
                            height: '240px',
                            overflow: 'hidden',
                            fontFamily: 'monospace',
                        }}
                    >
                        {/* タイピングアニメーションの実装 */}
                        {(() => {
                            const typingStart = 30;
                            const charsShown = Math.floor(interpolate(frame, [typingStart, durationPerItem - 30], [0, news.summary.length], {
                                extrapolateLeft: 'clamp',
                                extrapolateRight: 'clamp',
                            }));
                            return news.summary.slice(0, charsShown);
                        })()}
                        <span style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '32px',
                            backgroundColor: '#ff3e3e',
                            marginLeft: '5px',
                            verticalAlign: 'middle',
                            opacity: Math.floor(frame / 10) % 2 === 0 ? 1 : 0
                        }} />
                    </div>
                </div>

                {/* 進行中のプログレスバー */}
                <div style={{
                    marginTop: 'auto',
                    width: '100%',
                    height: 4,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    position: 'relative'
                }}>
                    <div style={{
                        width: `${(frame / durationPerItem) * 100}%`,
                        height: '100%',
                        backgroundColor: '#ff3e3e',
                        boxShadow: '0 0 10px #ff3e3e'
                    }} />
                </div>
            </div>
        </AbsoluteFill>
    );
};
