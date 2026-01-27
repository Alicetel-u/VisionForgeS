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
    const { fps } = useVideoConfig();

    // 現在のフレームに該当するシーンを見つける
    const threadDataForConfig: ProcessedItem[] = (threadDataRaw as unknown as ThreadItem[]).map(item => ({
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
        bgm: item.bgm || 'bgm/cute_standard.mp3',
        title: item.title
    }));

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

    // 写真があるシーンかどうかをチェック
    const hasPhoto = currentScene.bg_image && currentScene.bg_image !== 'images/bg_thread.jpg';

    return (
        <AbsoluteFill style={{ backgroundColor: '#050505', color: '#fff', fontFamily: 'Inter, "Noto Sans JP", sans-serif' }}>
            {/* シーンごとの背景BGM制御 */}
            {(() => {
                const bgmSequences: { bgm: string; start: number; duration: number }[] = [];
                let currentPos = 0;

                threadDataForConfig.forEach((scene) => {
                    const last = bgmSequences[bgmSequences.length - 1];
                    if (last && last.bgm === scene.bgm) {
                        last.duration += scene.durationInFrames;
                    } else {
                        bgmSequences.push({
                            bgm: scene.bgm,
                            start: currentPos,
                            duration: scene.durationInFrames
                        });
                    }
                    currentPos += scene.durationInFrames;
                });

                return bgmSequences.map((seg, idx) => (
                    <Sequence key={`bgm-${idx}`} from={seg.start} durationInFrames={seg.duration}>
                        <Audio src={staticFile(seg.bgm)} volume={0.06} loop />
                    </Sequence>
                ));
            })()}

            {/* 背景レイヤー（固定）は一番下に移動するため、ここでは一旦削除（後ろで再定義されます） */}

            {/* 背景レイヤー（固定） */}
            <div style={{
                position: 'absolute',
                inset: 0,
            }}>
                {/* Background & Base Layers */}
                <TheaterBackground scene={currentScene} isPreview={isPreview} />

                {/* キャラクター：端に寄せて重なりを防止 */}
                <div style={{
                    position: 'absolute',
                    bottom: -30, // さらに下げる
                    width: '100%',
                    height: 1080 * 0.9,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    padding: '0 20px',
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
                        transform: currentScene.speaker === 'kanon' ? 'scale(1.05) translateY(0px)' : 'scale(1.0) translateY(10px)',
                        filter: `drop-shadow(4px 0 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(0 -4px 0 white) ${currentScene.speaker === 'kanon' ? 'brightness(1)' : 'brightness(0.85) grayscale(0.1)'}`,
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
                        transform: currentScene.speaker === 'zundamon' ? 'scale(1.05) translateY(0px)' : 'scale(1.0) translateY(10px)',
                        filter: `drop-shadow(4px 0 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(0 -4px 0 white) ${currentScene.speaker === 'zundamon' ? 'brightness(1)' : 'brightness(0.85) grayscale(0.1)'}`,
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

            {/* 2. 演出エフェクトレイヤー（コンテンツの上に重ねる） */}
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

            {/* 決定的な瞬間のベタフラッシュ（パニックの始まりや驚き） */}
            {currentScene.emotion === 'panic' && sceneFrame < 25 && <BetaFlash frame={sceneFrame} opacity={0.7} />}

            {/* 漫符（Emblem Effects）: 話しているキャラの位置に合わせる */}
            {currentScene.emotion === 'angry' && <EmblemEffect type="angry" frame={sceneFrame} x={currentScene.speaker === 'kanon' ? '30%' : '70%'} y="25%" />}
            {currentScene.emotion === 'panic' && <EmblemEffect type="sweat" frame={sceneFrame} x={currentScene.speaker === 'kanon' ? '35%' : '75%'} y="30%" />}
            {((currentScene.action as string) === 'discovery' || (currentScene.action as string) === 'thinking') && (
                <EmblemEffect type="lightbulb" frame={sceneFrame} x={currentScene.speaker === 'kanon' ? '25%' : '75%'} y="15%" />
            )}

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
                    top: 20,
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

        </AbsoluteFill>
    );
};

const TheaterUI: React.FC<{ scene: ProcessedItem; isPreview: boolean }> = ({ scene, isPreview }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const commentEntrance = spring({ frame, fps, config: { damping: 15 } });

    // 話者の名前と色
    const speakerInfo = scene.speaker === 'kanon'
        ? { name: 'かのん', color: '#00bfff' }
        : { name: 'ずんだもん', color: '#adff2f' };

    return (
        <AbsoluteFill>
            <Audio src={staticFile(scene.audio)} />

            {/* Subtitles */}
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
                    width: '80%',
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

            {/* Headline Box: ガラスモーフィズム & 動的タイトル */}
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
                    WebkitBackdropFilter: 'blur(12px)',
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
                    {(scene as any).title || 'カノン＆ずんだもん'}
                </div>
            </div>
        </AbsoluteFill>
    );
};
