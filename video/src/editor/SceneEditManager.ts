/**
 * SceneEditManager - シーン編集状態管理
 *
 * 編集されたシーンを追跡し、Python側での部分再生成を
 * サポートするための基盤システム
 *
 * 使用フロー:
 * 1. ユーザーがEditPanelでシーンを編集
 * 2. SceneEditManagerが変更を記録
 * 3. exportPendingRegenerations()で再生成が必要なシーンリストを出力
 * 4. Python側がそのリストを読み込んで該当シーンの音声のみ再生成
 * 5. 再生成完了後、markRegenerationComplete()で完了をマーク
 */

import { ProcessedScene, Speaker } from '../types';
import { Emotion, Action } from '../AnimeCharacter';

/** シーン編集データ */
export interface SceneEdit {
    sceneId: number;
    originalText: string;
    newText: string;
    originalSpeaker: Speaker;
    newSpeaker: Speaker;
    originalEmotion: Emotion;
    newEmotion: Emotion;
    emphasisWords: string[];
    timestamp: number;
    needsAudioRegeneration: boolean;
    status: 'pending' | 'regenerating' | 'completed';
}

/** 再生成リクエスト（Python連携用） */
export interface RegenerationRequest {
    version: string;
    timestamp: number;
    scenes: RegenerationSceneData[];
}

/** 再生成対象シーンデータ */
export interface RegenerationSceneData {
    id: number;
    text: string;
    speaker: Speaker;
    emotion: Emotion;
    action: Action;
    audioPath: string;
    priority: 'high' | 'normal' | 'low';
}

/**
 * シーン編集マネージャークラス
 */
export class SceneEditManager {
    private edits: Map<number, SceneEdit> = new Map();
    private originalScenes: Map<number, ProcessedScene> = new Map();
    private listeners: Set<(edits: Map<number, SceneEdit>) => void> = new Set();

    /**
     * 初期シーンデータを登録
     */
    initialize(scenes: ProcessedScene[]): void {
        this.originalScenes.clear();
        scenes.forEach(scene => {
            this.originalScenes.set(scene.id, { ...scene });
        });
    }

    /**
     * シーンの編集を記録
     */
    recordEdit(
        sceneId: number,
        changes: {
            text?: string;
            speaker?: Speaker;
            emotion?: Emotion;
            emphasisWords?: string[];
        }
    ): void {
        const original = this.originalScenes.get(sceneId);
        if (!original) {
            console.warn(`Scene ${sceneId} not found in original scenes`);
            return;
        }

        const existingEdit = this.edits.get(sceneId);
        const currentText = existingEdit?.newText || original.text;
        const currentSpeaker = existingEdit?.newSpeaker || original.speaker;
        const currentEmotion = existingEdit?.newEmotion || original.emotion;

        const newText = changes.text ?? currentText;
        const newSpeaker = changes.speaker ?? currentSpeaker;
        const newEmotion = changes.emotion ?? currentEmotion;

        // テキストまたは話者が変わった場合は音声再生成が必要
        const needsAudioRegeneration =
            newText !== original.text ||
            newSpeaker !== original.speaker;

        const edit: SceneEdit = {
            sceneId,
            originalText: original.text,
            newText,
            originalSpeaker: original.speaker,
            newSpeaker,
            originalEmotion: original.emotion,
            newEmotion,
            emphasisWords: changes.emphasisWords || existingEdit?.emphasisWords || original.emphasis_words,
            timestamp: Date.now(),
            needsAudioRegeneration,
            status: needsAudioRegeneration ? 'pending' : 'completed'
        };

        this.edits.set(sceneId, edit);
        this.notifyListeners();
    }

    /**
     * 編集を取り消し（元に戻す）
     */
    revertEdit(sceneId: number): void {
        this.edits.delete(sceneId);
        this.notifyListeners();
    }

    /**
     * 全編集をクリア
     */
    clearAllEdits(): void {
        this.edits.clear();
        this.notifyListeners();
    }

    /**
     * 編集があるかチェック
     */
    hasEdit(sceneId: number): boolean {
        return this.edits.has(sceneId);
    }

    /**
     * 編集データを取得
     */
    getEdit(sceneId: number): SceneEdit | undefined {
        return this.edits.get(sceneId);
    }

    /**
     * 全編集を取得
     */
    getAllEdits(): Map<number, SceneEdit> {
        return new Map(this.edits);
    }

    /**
     * 再生成が必要なシーンを取得
     */
    getPendingRegenerations(): SceneEdit[] {
        return Array.from(this.edits.values())
            .filter(edit => edit.needsAudioRegeneration && edit.status === 'pending');
    }

    /**
     * 再生成リクエストをエクスポート（Python連携用）
     */
    exportRegenerationRequest(): RegenerationRequest {
        const pending = this.getPendingRegenerations();

        const scenes: RegenerationSceneData[] = pending.map(edit => {
            const original = this.originalScenes.get(edit.sceneId)!;
            return {
                id: edit.sceneId,
                text: edit.newText,
                speaker: edit.newSpeaker,
                emotion: edit.newEmotion,
                action: original.action,
                audioPath: original.audio,
                priority: 'normal'
            };
        });

        return {
            version: '1.0.0',
            timestamp: Date.now(),
            scenes
        };
    }

    /**
     * JSON形式でエクスポート
     */
    exportToJSON(): string {
        const request = this.exportRegenerationRequest();
        return JSON.stringify(request, null, 2);
    }

    /**
     * 再生成開始をマーク
     */
    markRegenerationStarted(sceneId: number): void {
        const edit = this.edits.get(sceneId);
        if (edit) {
            edit.status = 'regenerating';
            this.notifyListeners();
        }
    }

    /**
     * 再生成完了をマーク
     */
    markRegenerationComplete(sceneId: number): void {
        const edit = this.edits.get(sceneId);
        if (edit) {
            edit.status = 'completed';
            edit.needsAudioRegeneration = false;
            this.notifyListeners();
        }
    }

    /**
     * 編集済みシーンデータを取得（ProcessedScene形式）
     */
    getEditedScene(sceneId: number): ProcessedScene | undefined {
        const original = this.originalScenes.get(sceneId);
        const edit = this.edits.get(sceneId);

        if (!original) return undefined;
        if (!edit) return original;

        return {
            ...original,
            text: edit.newText,
            speaker: edit.newSpeaker,
            emotion: edit.newEmotion,
            emphasis_words: edit.emphasisWords
        };
    }

    /**
     * 全シーンを編集適用済みで取得
     */
    getEditedScenes(): ProcessedScene[] {
        return Array.from(this.originalScenes.values()).map(scene => {
            return this.getEditedScene(scene.id) || scene;
        });
    }

    /**
     * 変更リスナーを追加
     */
    addListener(listener: (edits: Map<number, SceneEdit>) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * リスナーに通知
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.edits));
    }

    /**
     * 統計情報を取得
     */
    getStatistics(): {
        totalEdits: number;
        pendingRegenerations: number;
        completedRegenerations: number;
        regeneratingCount: number;
    } {
        const edits = Array.from(this.edits.values());
        return {
            totalEdits: edits.length,
            pendingRegenerations: edits.filter(e => e.status === 'pending').length,
            completedRegenerations: edits.filter(e => e.status === 'completed').length,
            regeneratingCount: edits.filter(e => e.status === 'regenerating').length
        };
    }
}

/**
 * シングルトンインスタンス
 */
let instance: SceneEditManager | null = null;

export function getSceneEditManager(): SceneEditManager {
    if (!instance) {
        instance = new SceneEditManager();
    }
    return instance;
}

export function resetSceneEditManager(): void {
    instance = null;
}

export default SceneEditManager;
