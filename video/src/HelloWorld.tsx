/**
 * HelloWorld - メインコンポジション
 * リファクタリング済み：責務を各レイヤーに分離
 */

import React from 'react';
import {
    AbsoluteFill,
    Audio,
    Sequence,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';

// 型定義
import { ThreadItem, ProcessedScene } from './types';

// マネージャー
import {
    useSceneManager,
    getSceneSequenceInfo,
    detectTopicChange
} from './managers/SceneManager';

// レイヤー
import { BackgroundLayer } from './layers/BackgroundLayer';
import { CharacterLayer } from './layers/CharacterLayer';
import { UILayer } from './layers/UILayer';

// トランジション
import {
    TransitionRenderer,
    TRANSITION_DURATION,
    LogoTransition
} from './transitions';

// データ読み込み
import threadDataRaw from '../public/cat_data.json';

interface Props {
    isPreview?: boolean;
}

/**
 * メインコンポジションコンポーネント
 */
export const HelloWorld: React.FC<Props> = ({ isPreview = false }) => {
    const { width } = useVideoConfig();

    // シーン管理フックを使用
    const {
        scenes,
        state,
        totalDurationInFrames,
        endingStartFrame,
        prevScene
    } = useSceneManager({
        rawData: threadDataRaw as unknown as ThreadItem[]
    });

    const { currentScene, sceneFrame, isEndingScene, sceneIndex } = state;

    // プレビュー解像度(1280x720)を基準としたスケール計算
    const baseWidth = 1280;
    const scale = width / baseWidth;

    // トピック変更を検出してロゴトランジションを表示
    const isTopicChange = currentScene ? detectTopicChange(currentScene, prevScene) : false;

    return (
        <AbsoluteFill style={{
            backgroundColor: '#050505',
            color: '#fff',
            fontFamily: 'Inter, "Noto Sans JP", sans-serif'
        }}>
            {/* スケール適用コンテナ */}
            <div style={{
                width: baseWidth,
                height: 720,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0
            }}>
                {/* BGMシーケンス */}
                <BGMController
                    endingStartFrame={endingStartFrame}
                    totalDurationInFrames={totalDurationInFrames}
                />

                {/* 本編コンテンツ */}
                <Sequence from={0} durationInFrames={totalDurationInFrames}>
                    <AbsoluteFill>
                        {/* 背景レイヤー */}
                        <BackgroundLayer
                            scene={currentScene}
                            sceneFrame={sceneFrame}
                            isPreview={isPreview}
                            isEndingScene={isEndingScene}
                        />

                        {/* キャラクターレイヤー */}
                        <CharacterLayer
                            scene={currentScene}
                            sceneFrame={sceneFrame}
                            isPreview={isPreview}
                            isEndingScene={isEndingScene}
                        />

                        {/* UIレイヤー（シーンごとにSequenceで分離） */}
                        {getSceneSequenceInfo(scenes).map(({ scene, startFrame, index, prevScene: prev }) => (
                            <Sequence
                                key={`ui-${scene.id}-${index}`}
                                from={startFrame}
                                durationInFrames={scene.durationInFrames}
                            >
                                <UILayerWrapper
                                    scene={scene}
                                    isPreview={isPreview}
                                    prevScene={prev}
                                />
                            </Sequence>
                        ))}

                        {/* トランジションレイヤー */}
                        <TransitionLayer
                            scenes={scenes}
                            currentSceneIndex={sceneIndex}
                            sceneFrame={sceneFrame}
                        />
                    </AbsoluteFill>
                </Sequence>
            </div>
        </AbsoluteFill>
    );
};

/**
 * BGMコントローラー
 */
interface BGMControllerProps {
    endingStartFrame: number;
    totalDurationInFrames: number;
}

const BGMController: React.FC<BGMControllerProps> = ({
    endingStartFrame,
    totalDurationInFrames
}) => {
    return (
        <>
            <Sequence from={0} durationInFrames={endingStartFrame || totalDurationInFrames}>
                <Audio
                    src={staticFile('bgm/bgm_cute_main.mp3')}
                    volume={0.15}
                    loop
                />
            </Sequence>
            {endingStartFrame > 0 && (
                <Sequence from={endingStartFrame}>
                    <Audio
                        src={staticFile('bgm/電脳キャンディ★ガール.mp3')}
                        volume={0.15}
                        loop
                    />
                </Sequence>
            )}
        </>
    );
};

/**
 * UIレイヤーラッパー
 */
interface UILayerWrapperProps {
    scene: ProcessedScene;
    isPreview: boolean;
    prevScene: ProcessedScene | null;
}

const UILayerWrapper: React.FC<UILayerWrapperProps> = ({ scene, isPreview, prevScene }) => {
    const sceneFrame = useCurrentFrame();
    const isEndingScene = scene.bg_image?.includes('ending') || scene.id > 100;

    return (
        <UILayer
            scene={scene}
            sceneFrame={sceneFrame}
            isPreview={isPreview}
            isEndingScene={isEndingScene}
        />
    );
};

/**
 * トランジションレイヤー
 * シーン切り替え時のトランジションを表示
 */
interface TransitionLayerProps {
    scenes: ProcessedScene[];
    currentSceneIndex: number;
    sceneFrame: number;
}

const TransitionLayer: React.FC<TransitionLayerProps> = ({
    scenes,
    currentSceneIndex,
    sceneFrame
}) => {
    const currentScene = scenes[currentSceneIndex];
    const prevScene = currentSceneIndex > 0 ? scenes[currentSceneIndex - 1] : null;

    // トピック変更を検出
    const isTopicChange = detectTopicChange(currentScene, prevScene);

    // シーン開始時のトランジション（最初の18フレーム）
    if (sceneFrame < TRANSITION_DURATION && currentSceneIndex > 0) {
        const progress = sceneFrame / TRANSITION_DURATION;

        // トピックが変わった場合はロゴトランジション
        if (isTopicChange && currentScene.title) {
            return (
                <LogoTransition
                    progress={progress}
                    logoText={currentScene.title}
                    primaryColor="#ff3b30"
                    secondaryColor="#1a1a2e"
                />
            );
        }

        // 通常のトランジション
        if (currentScene.transition.type !== 'none') {
            return (
                <TransitionRenderer
                    config={currentScene.transition}
                    progress={progress}
                />
            );
        }
    }

    return null;
};

export default HelloWorld;
