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

    // Configがない、またはテキストが空の場合は表示しない
    if (!config || !text || text.trim() === '') {
        return null;
    }

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

    // 文字数に応じてフォントサイズを調整（3行以内に収めるため）
    const getFontSize = (length: number) => {
        if (length < 15) return 72; // 短い文は超巨大
        if (length < 25) return 60; // 普通の文
        if (length < 40) return 48; // 長文
        return 38; // かなり長文
    };

    const dynamicFontSize = getFontSize(text.length);

    return (
        <div style={{
            position: 'absolute',
            top: 50, // 画面最上部ギリギリ
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1500,
            pointerEvents: 'none'
        }}>
            {/* 赤座布団（バナースタイル） */}
            <div style={{
                position: 'relative',
                width: '95%', // 画面幅いっぱい
                backgroundColor: '#ee3322', // 朱色に近い赤
                padding: '15px 10px',
                borderRadius: 16,
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
            }}>
                <div style={{
                    fontSize: dynamicFontSize, // 動的サイズ
                    fontFamily: 'Keifont',
                    fontWeight: 900, // 極太
                    color: '#ffffff',
                    textAlign: 'center',
                    lineHeight: 1.15,
                    letterSpacing: '0px',
                    wordBreak: 'break-word',
                    textShadow: `
                        4px 4px 0 #000,
                        -4px -4px 0 #000,
                        -4px 4px 0 #000,
                        4px -4px 0 #000,
                        4px 0 0 #000,
                        -4px 0 0 #000,
                        0 4px 0 #000,
                        0 -4px 0 #000,
                        6px 6px 0 rgba(0,0,0,0.2)
                    ` // 以前よりさらに太い縁取り
                }}>
                    {processedText}
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
            color: '#ffff00', // 強烈な黄色
            fontWeight: 900,
            transform: `scale(${entranceScale * pulse * 1.2}) translate(${shake}px, 0)`, // 少し大きく
            textShadow: `
                2px 2px 0 #000,
                -2px -2px 0 #000,
                -2px 2px 0 #000,
                2px -2px 0 #000,
                0 0 10px rgba(255, 255, 0, 0.8)
            `, // 黒縁取り＋発光
            position: 'relative',
            padding: '0 4px',
            marginLeft: 4,
            marginRight: 4,
            zIndex: 10 // 通常文字より手前に
        }}>
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
