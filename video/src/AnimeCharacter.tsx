import React from 'react';
import { interpolate, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from 'remotion';

export type Emotion = 'normal' | 'happy' | 'surprised' | 'angry' | 'sad' | 'panic';

interface Props {
    type: 'zundamon' | 'metan' | 'kanon';
    emotion: Emotion;
    isSpeaking: boolean;
    style?: React.CSSProperties;
}

export const AnimeCharacter: React.FC<Props> = ({ type, emotion, isSpeaking, style }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // --- ぬるぬるアニメーション・エンジン (Pseudo-Live2D) ---

    // 1. 呼吸 (Breathing) - より控えめに
    const breatheY = Math.sin(frame / 25) * 0.008;
    const breatheX = Math.cos(frame / 30) * 0.005;

    // 2. 喋りに合わせた「跳ね」と「しなり」 - 大幅に抑制
    const jump = isSpeaking ? Math.abs(Math.sin(frame / 6)) * 12 : 0;
    const tilt = isSpeaking ? Math.sin(frame / 8) * 1.5 : 0;
    const skew = isSpeaking ? Math.sin(frame / 6) * 0.8 : 0;

    // 3. 3D首振り - 動きを小さく
    const rotateY = isSpeaking ? Math.sin(frame / 12) * 3 : Math.sin(frame / 40) * 1;
    const rotateX = isSpeaking ? Math.cos(frame / 15) * 1 : 0;

    // 4. 表情ごとの特殊な揺れ
    let emotionShakeX = 0;
    let emotionShakeY = 0;
    let filter = 'none';
    let emotionScale = 1;

    if (emotion === 'angry') {
        emotionShakeX = Math.sin(frame * 1.5) * 8;
        filter = 'sepia(0.4) hue-rotate(-50deg) saturate(1.8)';
    } else if (emotion === 'sad') {
        emotionShakeY = Math.sin(frame / 20) * 5;
        filter = 'brightness(0.8) saturate(0.6) hue-rotate(180deg)';
        emotionScale = 0.96;
    } else if (emotion === 'happy') {
        emotionShakeY = -Math.abs(Math.sin(frame / 5)) * 20;
        filter = 'brightness(1.05) saturate(1.1)';
        emotionScale = 1.04;
    } else if (emotion === 'surprised') {
        emotionScale = 1.05; // 控えめに拡大
        emotionShakeY = Math.sin(frame * 1.5) * 2; // 揺れを小さく、少し遅く
    } else if (emotion === 'panic') {
        emotionScale = 1.08;
        emotionShakeX = Math.sin(frame * 4) * 2; // 小刻みな震え
    }

    // 登場アニメーション
    const entrance = spring({
        frame,
        fps,
        config: { damping: 14, stiffness: 120 },
    });

    const finalTransform = `
        translate(${emotionShakeX}px, ${emotionShakeY - jump}px)
        perspective(1000px)
        rotateY(${rotateY}deg)
        rotateX(${rotateX}deg)
        rotateZ(${tilt}deg)
        skewX(${skew}deg)
        scaleX(${entrance * (1 + breatheX) * emotionScale})
        scaleY(${entrance * (1 + breatheY) * emotionScale})
    `;

    // KANON（今回追加された立ち絵切り替え式キャラクター）
    if (type === 'kanon') {
        return (
            <div style={{
                ...style,
                transform: `${style?.transform || ''} ${finalTransform}`,
                position: 'relative',
                width: style?.width || 500,
                height: style?.height || 700,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                filter: `drop-shadow(3px 3px 0px #000) drop-shadow(-3px -3px 0px #000) drop-shadow(3px 3px 0px #000) drop-shadow(-3px 3px 0px #000) ${filter}`,
                transition: 'filter 0.4s ease-in-out, opacity 0.3s ease-out'
            }}>
                <Img
                    src={staticFile(`images/characters/kanon/${emotion}.png`)}
                    style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        transformOrigin: 'bottom center',
                        // 喋っている間は少し拡大縮小させて「口パク」っぽさを出す（簡易版）
                        scale: isSpeaking ? 1 + Math.abs(Math.sin(frame / 3)) * 0.02 : 1
                    }}
                />

                {/* 感情アイコン */}
                <div style={{ position: 'absolute', top: -40, width: '100%', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
                    {emotion === 'angry' && (
                        <div style={{ position: 'absolute', top: 120, right: 30, fontSize: 100, transform: `rotate(${Math.sin(frame / 2) * 20}deg)` }}>💢</div>
                    )}
                    {emotion === 'surprised' && (
                        <div style={{ position: 'absolute', top: 50, fontSize: 130, filter: 'drop-shadow(0 0 10px #fff)' }}>‼️</div>
                    )}
                    {emotion === 'happy' && (
                        <>
                            <div style={{ position: 'absolute', top: 80, left: 30, fontSize: 80, opacity: Math.sin(frame / 5) }}>✨</div>
                            <div style={{ position: 'absolute', top: 150, right: 30, fontSize: 80, opacity: Math.cos(frame / 5) }}>🌸</div>
                        </>
                    )}
                    {emotion === 'sad' && (
                        <div style={{ position: 'absolute', top: 220, left: 80, fontSize: 90, opacity: 0.7 }}>💧</div>
                    )}
                    {emotion === 'panic' && (
                        <div style={{ position: 'absolute', top: 50, fontSize: 130, transform: `rotate(${frame * 10}deg)` }}>🌀</div>
                    )}
                </div>
            </div>
        );
    }

    // メタン
    if (type === 'metan') {
        return (
            <div style={{
                ...style,
                transform: `${style?.transform || ''} ${finalTransform}`,
                position: 'relative',
                width: style?.width || 450,
                height: style?.height || 650,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                filter: `drop-shadow(3px 3px 0px #000) drop-shadow(-3px -3px 0px #000) drop-shadow(3px -3px 0px #000) drop-shadow(-3px 3px 0px #000) ${filter}`,
                transition: 'filter 0.4s ease-in-out, opacity 0.3s ease-out'
            }}>
                <Img
                    src={staticFile('images/user_character.png')}
                    style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        transformOrigin: 'bottom center'
                    }}
                />

                {/* 感情アイコン */}
                <div style={{ position: 'absolute', top: -20, width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
                    {emotion === 'angry' && (
                        <div style={{ position: 'absolute', top: 100, right: 0, fontSize: 100, transform: `rotate(${Math.sin(frame / 2) * 20}deg)` }}>💢</div>
                    )}
                    {emotion === 'surprised' && (
                        <div style={{ position: 'absolute', top: 20, fontSize: 120, filter: 'drop-shadow(0 0 10px #fff)' }}>‼️</div>
                    )}
                    {emotion === 'happy' && (
                        <>
                            <div style={{ position: 'absolute', top: 60, left: 10, fontSize: 60, opacity: Math.sin(frame / 5) }}>✨</div>
                            <div style={{ position: 'absolute', top: 120, right: 10, fontSize: 60, opacity: Math.cos(frame / 5) }}>🌸</div>
                        </>
                    )}
                    {emotion === 'sad' && (
                        <div style={{ position: 'absolute', top: 180, left: 60, fontSize: 80, opacity: 0.7 }}>💧</div>
                    )}
                </div>
            </div>
        );
    }

    // 瞬き用
    const blink = Math.max(0, Math.sin(frame / 25) - 0.98) * 50;
    const mouthOpen = isSpeaking ? Math.abs(Math.sin(frame / 3)) : 0;

    // ずんだもん
    const colors = {
        zundamon: { primary: '#adff2f', secondary: '#32cd32', hair: '#adff2f', eye: '#000' }
    };
    const c = colors.zundamon;

    return (
        <div style={{
            ...style,
            transform: `${style?.transform || ''} ${finalTransform}`,
            position: 'relative',
            width: style?.width || 400,
            height: style?.height || 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            filter: `drop-shadow(3px 3px 0px #000) drop-shadow(-3px -3px 0px #000) drop-shadow(3px -3px 0px #000) drop-shadow(-3px 3px 0px #000) ${filter}`,
            transition: 'filter 0.4s ease-in-out, opacity 0.3s ease-out'
        }}>
            <div style={{ position: 'absolute', top: 0, width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
                {emotion === 'angry' && <div style={{ position: 'absolute', top: 50, right: 50, fontSize: 80, transform: `rotate(${Math.sin(frame / 2) * 20}deg)` }}>💢</div>}
                {emotion === 'surprised' && <div style={{ position: 'absolute', top: 20, fontSize: 100 }}>‼️</div>}
                {emotion === 'happy' && <div style={{ position: 'absolute', top: 40, fontSize: 80 }}>✨</div>}
                {emotion === 'sad' && <div style={{ position: 'absolute', top: 60, left: 60, fontSize: 60 }}>💧</div>}
            </div>

            <svg width="400" height="600" viewBox="0 0 400 600" style={{ transformOrigin: 'bottom center' }}>
                <path d="M 100 550 Q 200 200 300 550 Z" fill={c.secondary} stroke="#000" strokeWidth="8" />
                <ellipse cx="200" cy="220" rx="100" ry="110" fill="#fff" stroke="#000" strokeWidth="8" />
                <path d="M 100 200 Q 200 50 300 200" fill={c.hair} stroke="#000" strokeWidth="8" />
                <ellipse cx="100" cy="150" rx="30" ry="40" fill="#adff2f" stroke="#000" strokeWidth="6" />
                <ellipse cx="300" cy="150" rx="30" ry="40" fill="#adff2f" stroke="#000" strokeWidth="6" />

                {emotion === 'surprised' ? (
                    <>
                        <circle cx="160" cy="210" r="15" fill="#000" />
                        <circle cx="240" cy="210" r="15" fill="#000" />
                    </>
                ) : emotion === 'happy' ? (
                    <>
                        <path d="M 140 210 Q 160 180 180 210" fill="none" stroke="#000" strokeWidth="10" strokeLinecap="round" />
                        <path d="M 220 210 Q 240 180 260 210" fill="none" stroke="#000" strokeWidth="10" strokeLinecap="round" />
                    </>
                ) : emotion === 'sad' ? (
                    <>
                        <path d="M 140 200 Q 160 220 180 200" fill="none" stroke="#000" strokeWidth="10" strokeLinecap="round" />
                        <path d="M 220 200 Q 240 220 260 200" fill="none" stroke="#000" strokeWidth="10" strokeLinecap="round" />
                    </>
                ) : (
                    <>
                        <ellipse cx="160" cy="210" rx="20" ry={20 - blink} fill={c.eye} />
                        <ellipse cx="240" cy="210" rx="20" ry={20 - blink} fill={c.eye} />
                    </>
                )}

                <path
                    d={`M 170 270 Q 200 ${270 + mouthOpen * 40} 230 270`}
                    fill={isSpeaking ? "#ff6666" : "none"}
                    stroke="#000"
                    strokeWidth="6"
                    strokeLinecap="round"
                />

                <ellipse cx="130" cy="250" rx="15" ry="8" fill="rgba(255, 182, 193, 0.6)" />
                <ellipse cx="270" cy="250" rx="15" ry="8" fill="rgba(255, 182, 193, 0.6)" />
            </svg>
        </div>
    );
};
