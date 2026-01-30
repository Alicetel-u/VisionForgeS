/**
 * CharacterLayer - キャラクターレイヤー
 * キャラクターの配置、話者切り替え演出を担当
 */

import React from 'react';
import { AnimeCharacter } from '../AnimeCharacter';
import { getShakeStyle } from '../VisualEffects';
import { ProcessedScene, Speaker } from '../types';
import { getEmotionShakeIntensity } from '../managers/SceneManager';

interface CharacterLayerProps {
    scene: ProcessedScene;
    sceneFrame: number;
    isPreview: boolean;
    isEndingScene: boolean;
}

/**
 * キャラクターレイヤーコンポーネント
 */
export const CharacterLayer: React.FC<CharacterLayerProps> = ({
    scene,
    sceneFrame,
    isPreview,
    isEndingScene
}) => {
    // シェイク強度の計算
    const shakeIntensity = getEmotionShakeIntensity(scene.emotion, sceneFrame);

    return (
        <div style={{
            position: 'absolute',
            bottom: -30,
            width: '100%',
            height: 720 * 0.9,
            display: 'flex',
            justifyContent: !isEndingScene ? 'space-between' : 'center',
            alignItems: 'flex-end',
            padding: !isEndingScene ? '0 10px' : '0',
            gap: !isEndingScene ? 0 : 100,
            zIndex: 100,
            pointerEvents: 'none',
            ...getShakeStyle(sceneFrame, shakeIntensity)
        }}>
            {/* カノン（左側） */}
            <CharacterSlot
                characterType="kanon"
                currentSpeaker={scene.speaker}
                scene={scene}
                sceneFrame={sceneFrame}
                isPreview={isPreview}
                isEndingScene={isEndingScene}
                size={{ width: 460, height: 640 }}
            />

            {/* ずんだもん（右側） */}
            <CharacterSlot
                characterType="zundamon"
                currentSpeaker={scene.speaker}
                scene={scene}
                sceneFrame={sceneFrame}
                isPreview={isPreview}
                isEndingScene={isEndingScene}
                size={{ width: 500, height: 700 }}
            />
        </div>
    );
};

/**
 * 個別キャラクター配置スロット
 */
interface CharacterSlotProps {
    characterType: 'kanon' | 'zundamon';
    currentSpeaker: Speaker;
    scene: ProcessedScene;
    sceneFrame: number;
    isPreview: boolean;
    isEndingScene: boolean;
    size: { width: number; height: number };
}

const CharacterSlot: React.FC<CharacterSlotProps> = ({
    characterType,
    currentSpeaker,
    scene,
    sceneFrame,
    isPreview,
    isEndingScene,
    size
}) => {
    const isSpeaking = currentSpeaker === characterType;
    const isActive = isEndingScene || isSpeaking;

    // 話者かどうかでスタイルを変更
    const containerStyle: React.CSSProperties = {
        transform: !isEndingScene && isSpeaking
            ? 'scale(1.05) translateY(0px)'
            : 'scale(1.0) translateY(10px)',
        filter: `
            drop-shadow(4px 0 0 white)
            drop-shadow(-4px 0 0 white)
            drop-shadow(0 4px 0 white)
            drop-shadow(0 -4px 0 white)
            ${isActive ? 'brightness(1)' : 'brightness(0.85) grayscale(0.1)'}
        `,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    };

    // 表情とアクションの決定
    const emotion = isSpeaking ? scene.emotion : 'happy';
    const action = isSpeaking ? scene.action : 'none';

    return (
        <div style={containerStyle}>
            <AnimeCharacter
                type={characterType}
                emotion={emotion}
                action={action}
                frame={sceneFrame}
                isSpeaking={isSpeaking}
                lowQuality={isPreview}
                style={size}
            />
        </div>
    );
};

export default CharacterLayer;
