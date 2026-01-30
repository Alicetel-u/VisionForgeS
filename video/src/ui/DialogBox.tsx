/**
 * DialogBox - セリフ表示ボックス
 * モダンでプレミアムなデザインのセリフ表示
 * 強調ワードはアニメーション付きで目立たせる
 */

import React from 'react';
import { spring, useVideoConfig, interpolate } from 'remotion';
import { Speaker, SPEAKER_CONFIG, TelopSettings } from '../types';

interface DialogBoxProps {
    text: string;
    speaker: Speaker;
    sceneFrame: number;
    isPreview: boolean;
    emphasisWords?: string[];
    emphasisColor?: string;
    telop?: TelopSettings;
}

/**
 * ダイアログボックスコンポーネント
 */
export const DialogBox: React.FC<DialogBoxProps> = ({
    text,
    speaker,
    sceneFrame,
    isPreview,
    emphasisWords = [],
    emphasisColor = '#ff3b30',
    telop
}) => {
    const { fps } = useVideoConfig();
    const config = SPEAKER_CONFIG[speaker];

    // テロップ設定をマージ
    const finalEmphasisWords = telop?.emphasisWords || emphasisWords;
    const finalEmphasisColor = telop?.emphasisColor || emphasisColor;

    // 登場アニメーション
    const entrance = spring({
        frame: sceneFrame,
        fps,
        config: { damping: 15, stiffness: 180 }
    });

    // タイプライター効果用の文字数計算
    const charsPerFrame = 2.5;
    const visibleChars = Math.floor(sceneFrame * charsPerFrame);

    // テキストを強調ワードでハイライト処理
    const processedText = highlightEmphasis(
        text,
        finalEmphasisWords,
        visibleChars,
        sceneFrame,
        finalEmphasisColor,
        isPreview
    );

    return (
        <div style={{
            position: 'absolute',
            bottom: 25,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1500,
            pointerEvents: 'none'
        }}>
            {/* グラデーション背景（下部フェード） */}
            <div style={{
                position: 'absolute',
                bottom: -25,
                width: '100%',
                height: 280,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
                zIndex: -1,
                pointerEvents: 'none'
            }} />

            {/* メインボックス */}
            <div style={{
                position: 'relative',
                width: '88%',
                minHeight: 145,
                transform: `scale(${entrance}) translateY(${(1 - entrance) * 30}px)`,
                opacity: entrance
            }}>
                {/* 背景プレート */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,250,255,0.98) 100%)',
                    borderRadius: 20,
                    border: `5px solid ${config.color}`,
                    boxShadow: isPreview ? 'none' : `
                        0 10px 40px rgba(0,0,0,0.25),
                        0 0 0 1px rgba(255,255,255,0.1),
                        inset 0 1px 0 rgba(255,255,255,0.5),
                        inset 0 -2px 10px rgba(0,0,0,0.03)
                    `
                }} />

                {/* 話者タグ（上部に配置） */}
                <div style={{
                    position: 'absolute',
                    top: -18,
                    left: 30,
                    zIndex: 10
                }}>
                    <SpeakerTag speaker={speaker} sceneFrame={sceneFrame} isPreview={isPreview} />
                </div>

                {/* テキストコンテナ */}
                <div style={{
                    position: 'relative',
                    padding: '28px 45px 22px 45px',
                    zIndex: 1
                }}>
                    <div style={{
                        fontSize: 38,
                        fontWeight: 800,
                        color: '#1a1a1a',
                        textAlign: 'left',
                        lineHeight: 1.35,
                        letterSpacing: '-0.3px',
                        wordBreak: 'break-word'
                    }}>
                        {processedText}
                    </div>
                </div>

                {/* 装飾コーナー（右下） */}
                <div style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 20,
                    width: 30,
                    height: 3,
                    background: `linear-gradient(90deg, transparent, ${config.color})`,
                    borderRadius: 2
                }} />

                {/* 左下の装飾 */}
                <div style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 20,
                    display: 'flex',
                    gap: 4
                }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: config.color,
                            opacity: 0.3 + (i * 0.2)
                        }} />
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * 話者タグコンポーネント
 */
interface SpeakerTagProps {
    speaker: Speaker;
    sceneFrame: number;
    isPreview: boolean;
}

const SpeakerTag: React.FC<SpeakerTagProps> = ({ speaker, sceneFrame, isPreview }) => {
    const { fps } = useVideoConfig();
    const config = SPEAKER_CONFIG[speaker];

    const tagEntrance = spring({
        frame: sceneFrame,
        fps,
        config: { damping: 10, stiffness: 250 }
    });

    // 微細な脈動
    const pulse = 1 + Math.sin(sceneFrame / 15) * 0.02;

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: `linear-gradient(135deg, ${config.color} 0%, ${adjustBrightness(config.color, -20)} 100%)`,
            padding: '8px 24px',
            borderRadius: 25,
            transform: `scale(${tagEntrance * pulse})`,
            boxShadow: isPreview ? 'none' : `
                0 4px 15px ${config.color}50,
                inset 0 1px 0 rgba(255,255,255,0.3),
                0 0 20px ${config.color}30
            `
        }}>
            {/* パルスインジケーター */}
            <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: config.textColor === '#000000' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)',
                boxShadow: isPreview ? 'none' : `0 0 10px ${config.textColor === '#000000' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)'}`,
                transform: `scale(${1 + Math.sin(sceneFrame / 8) * 0.2})`
            }} />

            <span style={{
                fontSize: 22,
                fontWeight: 900,
                color: config.textColor,
                letterSpacing: '0.5px',
                textShadow: config.textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
            }}>
                {config.name}
            </span>
        </div>
    );
};

/**
 * 強調ワードコンポーネント
 * アニメーション付きで目立たせる
 */
interface EmphasisWordProps {
    word: string;
    sceneFrame: number;
    color: string;
    isPreview: boolean;
    index: number;
}

const EmphasisWord: React.FC<EmphasisWordProps> = ({
    word,
    sceneFrame,
    color,
    isPreview,
    index
}) => {
    // 各ワードに少しずらしたアニメーション
    const offset = index * 5;
    const adjustedFrame = Math.max(0, sceneFrame - offset);

    // 脈動アニメーション
    const pulse = 1 + Math.sin(adjustedFrame / 10) * 0.05;

    // シェイク（登場時）
    const shake = adjustedFrame < 15 ? Math.sin(adjustedFrame * 5) * 2 : 0;

    // グロー強度の変化
    const glowIntensity = 0.4 + Math.sin(adjustedFrame / 8) * 0.3;

    // 登場時のスケールアニメーション
    const entranceScale = interpolate(
        adjustedFrame,
        [0, 8, 12],
        [0.8, 1.25, 1],
        { extrapolateRight: 'clamp' }
    );

    return (
        <span style={{
            display: 'inline-block',
            color: color,
            fontWeight: 900,
            transform: `scale(${entranceScale * pulse}) translate(${shake}px, 0)`,
            textShadow: isPreview ? 'none' : `
                0 0 ${25 * glowIntensity}px ${color}A0,
                0 0 ${50 * glowIntensity}px ${color}50,
                0 2px 4px rgba(0,0,0,0.3)
            `,
            position: 'relative',
            padding: '0 4px',
            marginLeft: 2,
            marginRight: 2,
            background: `linear-gradient(to top, ${color}20, transparent)`,
            borderRadius: 4
        }}>
            {/* アンダーライン（輝く演出） */}
            <span style={{
                position: 'absolute',
                bottom: -2,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                borderRadius: 2,
                boxShadow: `0 0 10px ${color}`,
                opacity: interpolate(adjustedFrame, [0, 10, 40], [0, 1, 0.6], { extrapolateRight: 'clamp' })
            }} />
            {word}
        </span>
    );
};

/**
 * テキスト内の強調ワードをハイライト
 */
function highlightEmphasis(
    text: string,
    emphasisWords: string[],
    visibleChars: number,
    sceneFrame: number,
    emphasisColor: string,
    isPreview: boolean
): React.ReactNode {
    // タイプライター効果：表示する文字数を制限
    const displayText = text.slice(0, Math.min(visibleChars, text.length));

    if (emphasisWords.length === 0) {
        return displayText;
    }

    // 強調ワードを正規表現でマッチ
    const pattern = new RegExp(`(${emphasisWords.map(w => escapeRegex(w)).join('|')})`, 'g');
    const parts = displayText.split(pattern);

    let emphasisIndex = 0;

    return parts.map((part, index) => {
        const isEmphasis = emphasisWords.some(w => w === part);
        if (isEmphasis) {
            const currentIndex = emphasisIndex++;
            return (
                <EmphasisWord
                    key={`emphasis-${index}`}
                    word={part}
                    sceneFrame={sceneFrame}
                    color={emphasisColor}
                    isPreview={isPreview}
                    index={currentIndex}
                />
            );
        }
        return <span key={index}>{part}</span>;
    });
}

/**
 * 正規表現のエスケープ
 */
function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 色の明度を調整
 */
function adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export default DialogBox;
