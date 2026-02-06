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
            bottom: -80, // 画面下端からはみ出るくらい
            left: -80,   // 画面左端からはみ出るくらい（リファレンス画像準拠）
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            zIndex: 100,
            pointerEvents: 'none',
            ...getShakeStyle(sceneFrame, shakeIntensity)
        }}>
            {/* シングルキャラクター表示 */}
            <CharacterSlot
                characterType={scene.speaker === 'zundamon' ? 'zundamon' : 'kanon'}
                currentSpeaker={scene.speaker}
                scene={scene}
                sceneFrame={sceneFrame}
                isPreview={isPreview}
                isEndingScene={isEndingScene}
                size={{ width: 850, height: 1150 }} // 存在感のあるサイズに戻す
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

    // 話者かどうかでスタイルを変更（シングルモードなので常に強調、または話していない時は少し暗くする等）
    // 今回はシングル表示なので、遷移をスムーズにするために常に表示状態を基本とする
    const containerStyle: React.CSSProperties = {
        transform: 'scale(1.0)',
        // 完璧なステッカー風白フチ（4重がけで太くする）
        filter: `
            drop-shadow(0 0 0px white)
            drop-shadow(3px 3px 0px white)
            drop-shadow(-3px -3px 0px white)
            drop-shadow(-3px 3px 0px white)
            drop-shadow(3px -3px 0px white)
            drop-shadow(0 5px 15px rgba(0,0,0,0.4))
            ${isActive ? 'brightness(1.05)' : 'brightness(0.95)'}
        `,
        transition: 'all 0.2s ease-out'
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
