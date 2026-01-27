import React from 'react';
import { interpolate, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from 'remotion';

export type Emotion = 'normal' | 'happy' | 'surprised' | 'angry' | 'sad' | 'panic';
export type Action =
    | 'none'
    | 'jump'
    | 'big_jump'
    | 'nod'
    | 'shake_head'
    | 'shiver'
    | 'run_left'
    | 'run_right'
    | 'fly_away'
    | 'spin'
    | 'zoom_in'
    | 'back_off'
    | 'angry_vibe'
    | 'happy_hop'
    | 'fall_down'
    | 'thinking'
    | 'run'
    | 'discovery';

interface Props {
    type: 'zundamon' | 'metan' | 'kanon';
    emotion: Emotion;
    action?: Action;
    frame?: number;
    isSpeaking: boolean;
    style?: React.CSSProperties;
    lowQuality?: boolean;
}

export const AnimeCharacter: React.FC<Props> = ({ type, emotion, action = 'none', frame: propFrame, isSpeaking, style, lowQuality = false }) => {
    const defaultFrame = useCurrentFrame();
    const frame = propFrame !== undefined ? propFrame : defaultFrame;
    const { fps } = useVideoConfig();

    // --- ぬるぬるアニメーション・エンジン (Advanced Action System) ---

    // 1. 基本：呼吸 (Breathing)
    const breatheY = Math.sin(frame / 20) * 0.01;
    const breatheX = Math.cos(frame / 25) * 0.005;

    // 2. 基本：喋りに合わせた動き
    const speechJump = isSpeaking ? Math.abs(Math.sin(frame / 5)) * 8 : 0;
    const speechTilt = isSpeaking ? Math.sin(frame / 10) * 1.2 : 0;

    // 3. アクション定義
    let actionX = 0;
    let actionY = 0;
    let actionRotate = 0;
    let actionScaleX = 1;
    let actionScaleY = 1;
    let actionSkew = 0;
    let actionOpacity = 1;

    // 各種アクションのロジック
    if (action === 'jump') {
        const jumpVal = Math.abs(Math.sin(frame / 8)) * 100;
        actionY = -jumpVal;
        actionScaleY = 1 + (jumpVal / 500);
        actionScaleX = 1 - (jumpVal / 1000);
    } else if (action === 'big_jump') {
        actionY = interpolate(Math.abs(Math.sin(frame / 15)), [0, 1], [0, -400]);
        actionScaleY = 1.3;
        actionScaleX = 0.8;
    } else if (action === 'nod') {
        actionRotate = Math.sin(frame / 4) * 8;
        actionY = Math.abs(Math.sin(frame / 4)) * 10;
    } else if (action === 'shake_head') {
        actionRotate = Math.sin(frame / 3) * 15;
    } else if (action === 'shiver') {
        actionX = (Math.random() - 0.5) * 5;
        actionY = (Math.random() - 0.5) * 5;
    } else if (action === 'run_left') {
        actionX = interpolate(frame % 30, [0, 30], [500, -800]);
        actionSkew = -10;
        actionRotate = -5;
        actionY = -Math.abs(Math.sin(frame / 3)) * 30;
    } else if (action === 'run_right') {
        actionX = interpolate(frame % 30, [0, 30], [-500, 800]);
        actionSkew = 10;
        actionRotate = 5;
        actionY = -Math.abs(Math.sin(frame / 3)) * 30;
    } else if (action === 'fly_away') {
        const flyProgress = (frame % 40) / 40;
        actionX = interpolate(flyProgress, [0, 1], [0, 1000]);
        actionY = interpolate(flyProgress, [0, 1], [0, -800]);
        actionRotate = flyProgress * 1080;
        actionScaleX = 1 - flyProgress;
        actionScaleY = 1 - flyProgress;
        actionOpacity = 1 - flyProgress;
    } else if (action === 'spin') {
        actionRotate = frame * 15;
    } else if (action === 'zoom_in') {
        const zoom = 1 + Math.sin(frame / 10) * 0.2;
        actionScaleX = zoom;
        actionScaleY = zoom;
        actionY = -100 * (zoom - 1);
    } else if (action === 'back_off') {
        actionScaleX = 0.8;
        actionScaleY = 0.8;
        actionY = 50;
        actionSkew = Math.sin(frame / 15) * 5;
    } else if (action === 'angry_vibe') {
        actionX = (Math.random() - 0.5) * 15;
        actionScaleX = 1.1;
        actionScaleY = 1.1;
    } else if (action === 'happy_hop') {
        actionY = -Math.abs(Math.sin(frame / 5)) * 60;
        actionRotate = Math.sin(frame / 5) * 5;
    } else if (action === 'fall_down') {
        actionRotate = 90;
        actionY = 200;
        actionX = 50;
    } else if (action === 'thinking') {
        actionRotate = Math.sin(frame / 20) * 5;
        actionY = Math.sin(frame / 30) * 10;
        actionX = Math.cos(frame / 40) * 10;
    }

    // 登場アニメーション
    const entrance = spring({
        frame,
        fps,
        config: { damping: 14, stiffness: 120 },
    });

    // 最終的なトランスフォーム計算
    const finalTransform = `
        translate(${actionX}px, ${actionY - speechJump}px)
        rotate(${actionRotate}deg)
        skewX(${actionSkew}deg)
        scaleX(${entrance * (1 + breatheX) * actionScaleX})
        scaleY(${entrance * (1 + breatheY) * actionScaleY})
    `;

    // --- 各キャラクターのレンダリング部 ---

    // フィルター計算
    let emotionFilter = 'none';
    if (!lowQuality) {
        if (emotion === 'angry') emotionFilter = 'sepia(0.3) saturate(2)';
        else if (emotion === 'sad') emotionFilter = 'brightness(0.8) saturate(0.5)';
        else if (emotion === 'happy') emotionFilter = 'brightness(1.1)';
    }

    const containerStyle: React.CSSProperties = {
        ...style,
        transform: `${style?.transform || ''} ${finalTransform}`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        opacity: actionOpacity,
        filter: emotionFilter,
        transition: 'filter 0.4s ease, opacity 0.3s ease',
    };

    if (type === 'kanon') {
        const kanonFilter = lowQuality ? 'none' : `drop-shadow(0 0 10px rgba(0,0,0,0.5)) ${emotionFilter}`;

        // --- キャラクターフォルダ内から適切な素材を選択 ---
        let fileName = `${emotion}.png`;

        if (action === 'fall_down') {
            fileName = 'collapsed.png';
        } else if (emotion === 'panic') {
            fileName = 'shock.png';
        } else if (emotion === 'happy' && (action === 'jump' || action === 'big_jump' || action === 'happy_hop')) {
            fileName = 'excited.png';
        } else if (emotion === 'sad') {
            fileName = 'depressed.png';
        } else if (emotion === 'angry' && action === 'thinking') {
            fileName = 'mischievous.png';
        }

        return (
            <div style={{ ...containerStyle, width: style?.width || 500, height: style?.height || 700, filter: kanonFilter }}>
                <Img
                    src={staticFile(`images/characters/kanon/${fileName}`)}
                    style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        transformOrigin: 'bottom center',
                    }}
                />
                {/* 感情アイコン */}
                <div style={{ position: 'absolute', top: 0, width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
                    {emotion === 'angry' && <div style={{ position: 'absolute', top: 120, right: 30, fontSize: 100, transform: `rotate(${Math.sin(frame / 2) * 10}deg)` }}>💢</div>}
                    {emotion === 'surprised' && <div style={{ position: 'absolute', top: 50, fontSize: 130 }}>‼️</div>}
                    {emotion === 'happy' && <div style={{ position: 'absolute', top: 80, right: 30, fontSize: 80 }}>✨</div>}
                    {emotion === 'sad' && <div style={{ position: 'absolute', top: 220, left: 80, fontSize: 90 }}>💧</div>}
                    {emotion === 'panic' && <div style={{ position: 'absolute', top: 50, fontSize: 130, transform: `rotate(${frame * 5}deg)` }}>🌀</div>}
                </div>
            </div>
        );
    }

    if (type === 'metan') {
        return (
            <div style={{ ...containerStyle, width: style?.width || 450, height: style?.height || 650 }}>
                <Img
                    src={staticFile('images/user_character.png')}
                    style={{ width: '100%', height: 'auto', objectFit: 'contain', transformOrigin: 'bottom center' }}
                />
            </div>
        );
    }

    // ずんだもん (SVG)
    const blink = Math.max(0, Math.sin(frame / 25) - 0.98) * 50;
    const mouthOpen = isSpeaking ? Math.abs(Math.sin(frame / 3)) : 0;

    return (
        <div style={{ ...containerStyle, width: style?.width || 400, height: style?.height || 600 }}>
            <div style={{ position: 'absolute', top: 0, width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
                {emotion === 'angry' && <div style={{ position: 'absolute', top: 50, right: 50, fontSize: 80 }}>💢</div>}
                {emotion === 'surprised' && <div style={{ position: 'absolute', top: 20, fontSize: 100 }}>‼️</div>}
            </div>
            <svg width="400" height="600" viewBox="0 0 400 600" style={{ transformOrigin: 'bottom center' }}>
                <path d="M 100 550 Q 200 200 300 550 Z" fill="#32cd32" stroke="#000" strokeWidth="8" />
                <ellipse cx="200" cy="220" rx="100" ry="110" fill="#fff" stroke="#000" strokeWidth="8" />
                <ellipse cx="160" cy="210" rx="20" ry={20 - blink} fill="#000" />
                <ellipse cx="240" cy="210" rx="20" ry={20 - blink} fill="#000" />
                <path
                    d={`M 170 270 Q 200 ${270 + mouthOpen * 40} 230 270`}
                    fill={isSpeaking ? "#ff6666" : "none"}
                    stroke="#000"
                    strokeWidth="6"
                />
            </svg>
        </div>
    );
};
