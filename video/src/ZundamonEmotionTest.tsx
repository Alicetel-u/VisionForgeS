import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimeCharacter, Emotion } from './AnimeCharacter';

export const ZundamonEmotionTest: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const emotions: Emotion[] = ['normal', 'happy', 'surprised', 'angry', 'sad', 'panic', 'impressed'];

    // 2秒(fps * 2フレーム)ごとに切り替え
    const switchInterval = fps * 2;
    const index = Math.floor(frame / switchInterval) % emotions.length;
    const currentEmotion = emotions[index];

    return (
        <AbsoluteFill style={{ backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 style={{
                    marginTop: 0,
                    marginBottom: 20,
                    fontSize: 60,
                    fontFamily: 'sans-serif',
                    color: '#333',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.1)'
                }}>
                    Emoji: {currentEmotion}
                </h1>
                <AnimeCharacter
                    type="zundamon"
                    emotion={currentEmotion}
                    isSpeaking={false}
                    style={{ width: 600, height: 800 }}
                />

                <div style={{
                    marginTop: 20,
                    fontSize: 24,
                    color: '#666',
                    fontFamily: 'monospace'
                }}>
                    Frame: {frame} (Index: {index})
                </div>
            </div>
        </AbsoluteFill>
    );
};
