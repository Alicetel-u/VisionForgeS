/**
 * SceneManager - シーン状態管理
 * 現在のフレームに基づいてシーン状態を計算するカスタムフック
 */

import { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import {
    ThreadItem,
    ProcessedScene,
    SceneState,
    processThreadItem,
    DEFAULT_TRANSITION
} from '../types';
import { TRANSITION_DURATION } from '../transitions';

interface UseSceneManagerOptions {
    /** JSONデータ */
    rawData: ThreadItem[];
    /** 外部からフレームを指定する場合（オプション） */
    externalFrame?: number;
}

interface UseSceneManagerResult {
    /** 全シーンの処理済みデータ */
    scenes: ProcessedScene[];
    /** 現在のシーン状態 */
    state: SceneState;
    /** 動画全体の長さ（フレーム） */
    totalDurationInFrames: number;
    /** エンディング開始フレーム */
    endingStartFrame: number;
    /** 次のシーン（トランジション用） */
    nextScene: ProcessedScene | null;
    /** 前のシーン（トランジション用） */
    prevScene: ProcessedScene | null;
}

/**
 * シーン状態を管理するカスタムフック
 */
export function useSceneManager({
    rawData,
    externalFrame
}: UseSceneManagerOptions): UseSceneManagerResult {
    const defaultFrame = useCurrentFrame();
    const frame = externalFrame ?? defaultFrame;
    const { fps } = useVideoConfig();

    // 全シーンを処理（メモ化）
    const scenes = useMemo(() => {
        let lastBgm = 'bgm/bgm_cute_main.mp3';
        return rawData.map(item => {
            if (item.bgm) {
                lastBgm = item.bgm;
            }
            return processThreadItem(item, fps, lastBgm);
        });
    }, [rawData, fps]);

    // 動画全体の長さを計算
    const totalDurationInFrames = useMemo(() => {
        return scenes.reduce((acc, scene) => acc + scene.durationInFrames, 0);
    }, [scenes]);

    // エンディング開始フレーム（最後の4シーン手前）
    const endingStartFrame = useMemo(() => {
        if (scenes.length <= 4) return 0;
        return scenes
            .slice(0, -4)
            .reduce((acc, scene) => acc + scene.durationInFrames, 0);
    }, [scenes]);

    // 現在のシーン状態を計算
    const state = useMemo((): SceneState => {
        let cumulativeFrames = 0;
        let currentScene = scenes[0];
        let sceneFrame = 0;
        let sceneIndex = 0;

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            if (frame >= cumulativeFrames && frame < cumulativeFrames + scene.durationInFrames) {
                currentScene = scene;
                sceneFrame = frame - cumulativeFrames;
                sceneIndex = i;
                break;
            }
            cumulativeFrames += scene.durationInFrames;
        }

        // 安全策：現在のシーンが見つからない場合
        if (!currentScene) {
            currentScene = scenes[0];
        }

        // エンディングシーンの判定（エンディング固定パートのみ）
        const isEndingScene =
            currentScene?.bg_image?.includes('bg_ending_neon') ||
            (currentScene?.id ?? 0) > 100;

        // トランジション状態の計算
        const transitionDuration = currentScene.transition.duration || TRANSITION_DURATION;
        const { isInTransition, transitionProgress } = calculateTransitionState(
            sceneFrame,
            currentScene.durationInFrames,
            transitionDuration
        );

        return {
            currentScene,
            sceneFrame,
            sceneIndex,
            isEndingScene,
            totalScenes: scenes.length,
            cumulativeFrames,
            isInTransition,
            transitionProgress
        };
    }, [scenes, frame]);

    // 次のシーンと前のシーン
    const nextScene = state.sceneIndex < scenes.length - 1
        ? scenes[state.sceneIndex + 1]
        : null;
    const prevScene = state.sceneIndex > 0
        ? scenes[state.sceneIndex - 1]
        : null;

    return {
        scenes,
        state,
        totalDurationInFrames,
        endingStartFrame,
        nextScene,
        prevScene
    };
}

/**
 * トランジション状態を計算
 */
function calculateTransitionState(
    sceneFrame: number,
    sceneDuration: number,
    transitionDuration: number
): { isInTransition: boolean; transitionProgress: number } {
    // シーン開始時のトランジション（イン）
    if (sceneFrame < transitionDuration) {
        const progress = interpolate(
            sceneFrame,
            [0, transitionDuration],
            [0, 1],
            { extrapolateRight: 'clamp' }
        );
        return { isInTransition: true, transitionProgress: progress };
    }

    // シーン終了時のトランジション（アウト）
    const outStart = sceneDuration - transitionDuration;
    if (sceneFrame >= outStart) {
        const progress = interpolate(
            sceneFrame,
            [outStart, sceneDuration],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        return { isInTransition: true, transitionProgress: progress };
    }

    return { isInTransition: false, transitionProgress: 0 };
}

/**
 * シーケンス情報を生成するヘルパー
 */
export function getSceneSequenceInfo(scenes: ProcessedScene[]) {
    const sequenceInfo: Array<{
        scene: ProcessedScene;
        startFrame: number;
        endFrame: number;
        index: number;
        prevScene: ProcessedScene | null;
        nextScene: ProcessedScene | null;
    }> = [];

    let cumulativeFrames = 0;
    scenes.forEach((scene, index) => {
        sequenceInfo.push({
            scene,
            startFrame: cumulativeFrames,
            endFrame: cumulativeFrames + scene.durationInFrames,
            index,
            prevScene: index > 0 ? scenes[index - 1] : null,
            nextScene: index < scenes.length - 1 ? scenes[index + 1] : null
        });
        cumulativeFrames += scene.durationInFrames;
    });

    return sequenceInfo;
}

/**
 * 感情に基づくシェイク強度を計算
 */
export function getEmotionShakeIntensity(
    emotion: string,
    sceneFrame: number
): number {
    switch (emotion) {
        case 'panic':
            return 4;
        case 'surprised':
            return sceneFrame < 15 ? 7 : 0;
        case 'angry':
            return 2;
        default:
            return 0;
    }
}

/**
 * トピック変更を検出（トランジション自動適用用）
 */
export function detectTopicChange(
    currentScene: ProcessedScene | undefined,
    prevScene: ProcessedScene | null
): boolean {
    if (!currentScene) return false;
    if (!prevScene) return true; // 最初のシーン

    // タイトルが変わったらトピック変更
    if (currentScene.title !== prevScene.title) return true;

    // 演出ヒントでトピック変更が指定されている
    if (currentScene.direction.isTopicChange) return true;

    return false;
}
