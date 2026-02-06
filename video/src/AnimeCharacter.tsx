import React from 'react';
import { interpolate, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from 'remotion';

export type Emotion = 'normal' | 'happy' | 'surprised' | 'angry' | 'sad' | 'panic' | 'impressed' | 'sleepy' | 'money' | 'broke' | 'injured' | 'kick' | 'despair';
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

    // 1. 基本：呼吸 (Breathing) - 生きている感を強調
    // 振幅を大きくし、XとYを逆位相にして「体積の変化」を表現（スクワッシュ＆ストレッチの基本）
    const breatheY = Math.sin(frame / 30) * 0.025;
    const breatheX = -Math.sin(frame / 30) * 0.015;
    const breatheRot = Math.sin(frame / 60) * 1.5; // ゆらゆら揺れる

    // 2. 基本：喋りに合わせた動き (Squash & Stretch Talking)
    // 単なる上下移動ではなく、伸び縮みを加えることで「弾力」を出す
    const speechCycle = frame * 0.8; // 喋りのリズム
    const isTalkFrame = isSpeaking;

    // 喋っているときの跳ねる動き
    const speechJump = isTalkFrame ? Math.abs(Math.sin(speechCycle)) * 15 : 0;
    // 喋っているときの伸縮（ジャンプ中に縦に伸び、着地で少し潰れる）
    const speechScaleY = isTalkFrame ? 1 + Math.sin(speechCycle) * 0.05 : 1;
    const speechScaleX = isTalkFrame ? 1 - Math.sin(speechCycle) * 0.03 : 1;

    // 3. アクション定義
    let actionX = 0;
    let actionY = 0;
    let actionRotate = 0;
    let actionScaleX = 1;
    let actionScaleY = 1;
    let actionSkew = 0;
    let actionOpacity = 1;

    // 各種アクションのロジック
    // ... (既存のアクションロジックはそのまま維持しつつ、補強)

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
        // 頷きも「お辞儀」のように深く
        actionRotate = Math.sin(frame / 4) * 12;
        actionY = Math.abs(Math.sin(frame / 4)) * 20;
    } else if (action === 'shake_head') {
        actionRotate = Math.sin(frame / 3) * 20;
    } else if (action === 'shiver') {
        actionX = (Math.random() - 0.5) * 10;
        actionY = (Math.random() - 0.5) * 10;
        actionScaleX = 0.95 + Math.random() * 0.1; // 震えながら伸縮
    } else if (action === 'run_left') {
        actionX = interpolate(frame % 30, [0, 30], [500, -800]);
        actionSkew = -15;
        actionRotate = -8;
        actionY = -Math.abs(Math.sin(frame / 3)) * 40;
    } else if (action === 'run_right') {
        actionX = interpolate(frame % 30, [0, 30], [-500, 800]);
        actionSkew = 15;
        actionRotate = 8;
        actionY = -Math.abs(Math.sin(frame / 3)) * 40;
    } else if (action === 'fly_away') {
        const flyProgress = (frame % 40) / 40;
        actionX = interpolate(flyProgress, [0, 1], [0, 1000]);
        actionY = interpolate(flyProgress, [0, 1], [0, -800]);
        actionRotate = flyProgress * 1080;
        actionScaleX = 1 - flyProgress;
        actionScaleY = 1 - flyProgress;
        actionOpacity = 1 - flyProgress;
    } else if (action === 'spin') {
        actionRotate = frame * 25; // 高速回転
    } else if (action === 'zoom_in') {
        const zoom = 1 + Math.sin(frame / 10) * 0.3;
        actionScaleX = zoom;
        actionScaleY = zoom;
        actionY = -150 * (zoom - 1);
    } else if (action === 'angry_vibe') {
        actionX = (Math.random() - 0.5) * 20;
        actionScaleX = 1.2;
        actionScaleY = 1.2;
    } else if (action === 'happy_hop') {
        actionY = -Math.abs(Math.sin(frame / 5)) * 80;
        actionRotate = Math.sin(frame / 5) * 10;
        // ホップ中に伸びる
        actionScaleY = 1 + Math.abs(Math.sin(frame / 5)) * 0.2;
        actionScaleX = 1 - Math.abs(Math.sin(frame / 5)) * 0.1;
    } else if (action === 'fall_down') {
        actionRotate = 90;
        actionY = 300;
        actionX = 100;
    } else if (action === 'thinking') {
        actionRotate = Math.sin(frame / 30) * 8;
        actionY = Math.sin(frame / 40) * 15;
        actionX = Math.cos(frame / 50) * 15;
    } else if (action === 'discovery') {
        // 発見した瞬間の「ビクッ！」感
        const shock = Math.max(0, 1 - (frame % 20) / 5);
        actionY = -shock * 50;
        actionScaleX = 1 + shock * 0.3;
        actionScaleY = 1 - shock * 0.2;
    }

    // 登場アニメーション
    const entrance = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 180 }, // より弾むように設定
    });

    // 最終的なトランスフォーム計算
    // 呼吸 + 喋り伸縮 + アクション伸縮 を全て掛け合わせる
    const finalTransform = `
        translate(${actionX}px, ${actionY - speechJump}px)
        rotate(${actionRotate + breatheRot}deg)
        skewX(${actionSkew}deg)
        scaleX(${(1 + breatheX) * speechScaleX * actionScaleX})
        scaleY(${(1 + breatheY) * speechScaleY * actionScaleY})
    `;

    // --- 各キャラクターのレンダリング部 ---

    // フィルター計算
    let emotionFilter = 'none';
    if (!lowQuality) {
        if (emotion === 'angry') emotionFilter = 'sepia(0.3) saturate(2)';
        else if (emotion === 'sad') emotionFilter = 'brightness(0.8) saturate(0.5)';
        else if (emotion === 'happy') emotionFilter = 'brightness(1.1)';
        else if (emotion === 'injured') emotionFilter = 'sepia(0.2) brightness(0.9)';
        else if (emotion === 'sleepy') emotionFilter = 'brightness(0.95) contrast(0.9)';
        else if (emotion === 'despair') emotionFilter = 'brightness(0.8) saturate(0.3) hue-rotate(200deg)';
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
        } else if (emotion === 'panic' || emotion === 'surprised') {
            fileName = 'shock.png';
        } else if ((emotion === 'happy' || emotion === 'impressed') && (action === 'jump' || action === 'big_jump' || action === 'happy_hop' || action === 'discovery')) {
            fileName = 'excited.png';
        } else if (emotion === 'impressed') {
            fileName = 'happy.png'; // または専用の画像があればそれに
        } else if (emotion === 'sad') {
            fileName = 'depressed.png';
        } else if (emotion === 'angry' || action === 'thinking') {
            fileName = (emotion === 'happy' || action === 'thinking') ? 'mischievous.png' : 'angry.png';
        }

        return (
            <div style={{ ...containerStyle, width: style?.width || 500, height: style?.height || 700, filter: kanonFilter }}>
                <Img
                    src={staticFile(`images/characters/kanon/${fileName}`)}
                    style={{
                        height: '100%',
                        width: 'auto',
                        objectFit: 'contain',
                        transformOrigin: 'bottom center',
                    }}
                />
                {/* 感情アイコン */}
                <div style={{ position: 'absolute', top: 0, width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
                    {emotion === 'angry' && <div style={{ position: 'absolute', top: 120, right: 30, fontSize: 100, transform: `rotate(${Math.sin(frame / 2) * 10}deg)` }}>💢</div>}
                    {emotion === 'surprised' && <div style={{ position: 'absolute', top: 50, fontSize: 130, transform: `scale(${1 + Math.sin(frame / 3) * 0.1})` }}>‼️</div>}
                    {emotion === 'happy' && (
                        <>
                            <div style={{ position: 'absolute', top: 80, right: 30, fontSize: 80, transform: `translateY(${Math.sin(frame / 10) * 20}px)` }}>✨</div>
                            <div style={{ position: 'absolute', top: 150, left: 30, fontSize: 60, opacity: 0.7, transform: `translateY(${Math.cos(frame / 15) * 30}px)` }}>❤️</div>
                            <div style={{ position: 'absolute', top: 250, right: 50, fontSize: 50, opacity: 0.6, transform: `translateY(${Math.sin(frame / 12) * 40}px)` }}>🌸</div>
                        </>
                    )}
                    {emotion === 'sad' && <div style={{ position: 'absolute', top: 220, left: 80, fontSize: 90, transform: `translateY(${frame % 30 * 5}px)`, opacity: 1 - (frame % 30 / 30) }}>💧</div>}
                    {emotion === 'panic' && (
                        <>
                            <div style={{ position: 'absolute', top: 50, fontSize: 130, transform: `rotate(${frame * 10}deg)` }}>🌀</div>
                            <div style={{ position: 'absolute', top: 120, left: 40, fontSize: 80, transform: `translateX(${Math.sin(frame / 2) * 10}px)` }}>💦</div>
                        </>
                    )}
                    {emotion === 'money' && <div style={{ position: 'absolute', top: 100, right: 50, fontSize: 100, transform: `scale(${1 + Math.sin(frame / 5) * 0.2})` }}>🤑</div>}
                    {emotion === 'broke' && <div style={{ position: 'absolute', top: 250, left: 60, fontSize: 90, transform: `translateY(${frame % 40 * 4}px)`, opacity: 1 - (frame % 40 / 40) }}>💸</div>}
                    {emotion === 'sleepy' && <div style={{ position: 'absolute', top: 80, left: 40, fontSize: 80, transform: `scale(${0.8 + Math.sin(frame / 20) * 0.2})` }}>💤</div>}
                    {emotion === 'injured' && <div style={{ position: 'absolute', top: 150, right: 20, fontSize: 90 }}>🩹</div>}
                    {emotion === 'kick' && <div style={{ position: 'absolute', bottom: 150, left: 50, fontSize: 120, transform: `scale(${1.5 - (frame % 10 / 10)})` }}>💥</div>}
                    {emotion === 'despair' && (
                        <div style={{ position: 'absolute', top: 0, width: '100%', height: '100%' }}>
                            <div style={{ position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)', fontSize: 130, filter: 'grayscale(1)', opacity: 0.8 }}>👻</div>
                            <div style={{ position: 'absolute', top: 50, width: '100%', height: '100%', background: 'linear-gradient(transparent, rgba(0,0,100,0.2))', pointerEvents: 'none' }} />
                        </div>
                    )}
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

    if (type === 'zundamon') {
        const zundaFilter = lowQuality ? 'none' : `drop-shadow(0 0 10px rgba(0,0,0,0.5)) ${emotionFilter}`;

        // リップシンク (口パク)
        // 4フレームごとに開閉 (FPS=24なら秒間6回パカパカ)
        const mouthOpen = isSpeaking && Math.floor(frame / 4) % 2 === 0;
        const suffix = mouthOpen ? 'open' : 'close';

        // 利用可能な感情（画像ファイルが存在するもの）
        const availableEmotions = ['normal', 'happy', 'surprised', 'angry', 'sad', 'panic', 'impressed'];

        // 存在しない感情はnormalにフォールバック
        const validEmotion = availableEmotions.includes(emotion) ? emotion : 'normal';

        // 基本の感情画像
        let fileName = `${validEmotion}_${suffix}.png`;

        return (
            <div style={{ ...containerStyle, width: style?.width || 500, height: style?.height || 700, filter: zundaFilter }}>
                <Img
                    src={staticFile(`images/characters/zundamon/${fileName}`)}
                    style={{
                        height: '100%',
                        width: 'auto',
                        objectFit: 'contain',
                        transformOrigin: 'bottom center',
                    }}
                />
                {/* ずんだもん専用感情エフェクト */}
                <div style={{ position: 'absolute', top: 0, width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
                    {emotion === 'angry' && <div style={{ position: 'absolute', top: 120, right: 30, fontSize: 100, transform: `rotate(${Math.sin(frame / 2) * 10}deg)` }}>💢</div>}
                    {emotion === 'surprised' && <div style={{ position: 'absolute', top: 50, fontSize: 130 }}>‼️</div>}
                    {emotion === 'panic' && <div style={{ position: 'absolute', top: 100, fontSize: 130, filter: 'hue-rotate(180deg)', opacity: 0.7 }}>🌀</div>}
                    {emotion === 'happy' && <div style={{ position: 'absolute', top: 80, right: 30, fontSize: 80 }}>✨</div>}
                    {emotion === 'sad' && <div style={{ position: 'absolute', top: 200, left: 30, fontSize: 100, opacity: 0.8 }}>💧</div>}
                </div>
            </div>
        );
    }

    // デフォルト（フォールバック）
    return (
        <div style={{ ...containerStyle, width: style?.width || 400, height: style?.height || 600 }}>
            <div style={{ position: 'absolute', top: 0, width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
                {emotion === 'angry' && <div style={{ position: 'absolute', top: 50, right: 50, fontSize: 80 }}>💢</div>}
                {emotion === 'surprised' && <div style={{ position: 'absolute', top: 20, fontSize: 100 }}>‼️</div>}
            </div>
            <div style={{ width: '100%', height: '100%', backgroundColor: '#32cd32', borderRadius: '50% 50% 0 0', border: '8px solid black' }} />
        </div>
    );
};
