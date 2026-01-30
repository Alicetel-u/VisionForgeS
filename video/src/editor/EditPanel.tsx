/**
 * EditPanel - シーン編集パネル
 * 現在のシーンの情報を表示・編集するためのデバッグ/編集UI
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ProcessedScene, Speaker, SPEAKER_CONFIG } from '../types';
import { Emotion, Action } from '../AnimeCharacter';

interface EditPanelProps {
    scene: ProcessedScene;
    sceneIndex: number;
    totalScenes: number;
    sceneFrame: number;
    onSceneChange?: (sceneIndex: number) => void;
    onSceneEdit?: (sceneId: number, changes: Partial<SceneEditData>) => void;
}

/** 編集可能なシーンデータ */
export interface SceneEditData {
    text: string;
    speaker: Speaker;
    emotion: Emotion;
    action: Action;
    bg_image: string;
    title?: string;
    emphasisWords: string[];
    needsRegeneration: boolean;
}

/**
 * 編集パネルコンポーネント
 */
export const EditPanel: React.FC<EditPanelProps> = ({
    scene,
    sceneIndex,
    totalScenes,
    sceneFrame,
    onSceneChange,
    onSceneEdit
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [localText, setLocalText] = useState(scene.text);
    const [localEmphasis, setLocalEmphasis] = useState(scene.emphasis_words.join(', '));

    // シーンが変わったらローカル状態をリセット
    useEffect(() => {
        setLocalText(scene.text);
        setLocalEmphasis(scene.emphasis_words.join(', '));
    }, [scene.id, scene.text, scene.emphasis_words]);

    const handlePrevScene = useCallback(() => {
        if (onSceneChange && sceneIndex > 0) {
            onSceneChange(sceneIndex - 1);
        }
    }, [onSceneChange, sceneIndex]);

    const handleNextScene = useCallback(() => {
        if (onSceneChange && sceneIndex < totalScenes - 1) {
            onSceneChange(sceneIndex + 1);
        }
    }, [onSceneChange, sceneIndex, totalScenes]);

    const handleSaveEdit = useCallback(() => {
        if (onSceneEdit) {
            onSceneEdit(scene.id, {
                text: localText,
                emphasisWords: localEmphasis.split(',').map(w => w.trim()).filter(Boolean),
                needsRegeneration: localText !== scene.text
            });
        }
        setEditMode(false);
    }, [onSceneEdit, scene.id, scene.text, localText, localEmphasis]);

    const speakerConfig = SPEAKER_CONFIG[scene.speaker];

    return (
        <div style={styles.container}>
            {/* ヘッダー */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <span style={styles.logo}>🎬</span>
                    <span style={styles.title}>Scene Editor</span>
                </div>
                <button
                    style={styles.toggleButton}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? '▼' : '▲'}
                </button>
            </div>

            {isExpanded && (
                <div style={styles.content}>
                    {/* シーンナビゲーション */}
                    <div style={styles.navigation}>
                        <button
                            style={{
                                ...styles.navButton,
                                opacity: sceneIndex === 0 ? 0.3 : 1
                            }}
                            onClick={handlePrevScene}
                            disabled={sceneIndex === 0}
                        >
                            ◀ Prev
                        </button>
                        <div style={styles.sceneCounter}>
                            <span style={styles.currentScene}>{sceneIndex + 1}</span>
                            <span style={styles.separator}>/</span>
                            <span style={styles.totalScenes}>{totalScenes}</span>
                        </div>
                        <button
                            style={{
                                ...styles.navButton,
                                opacity: sceneIndex === totalScenes - 1 ? 0.3 : 1
                            }}
                            onClick={handleNextScene}
                            disabled={sceneIndex === totalScenes - 1}
                        >
                            Next ▶
                        </button>
                    </div>

                    {/* シーン進行バー */}
                    <div style={styles.progressContainer}>
                        <div style={styles.progressLabel}>
                            Frame: {sceneFrame} / {scene.durationInFrames}
                        </div>
                        <div style={styles.progressBar}>
                            <div
                                style={{
                                    ...styles.progressFill,
                                    width: `${(sceneFrame / scene.durationInFrames) * 100}%`
                                }}
                            />
                        </div>
                    </div>

                    {/* シーン情報 */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Scene Info</div>
                        <div style={styles.infoGrid}>
                            <InfoRow label="ID" value={`#${scene.id}`} />
                            <InfoRow label="Type" value={scene.type} />
                            <InfoRow
                                label="Speaker"
                                value={speakerConfig.name}
                                color={speakerConfig.color}
                            />
                            <InfoRow label="Emotion" value={scene.emotion} highlight />
                            <InfoRow label="Action" value={scene.action} />
                        </div>
                    </div>

                    {/* テキスト編集 */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <span style={styles.sectionTitle}>Text</span>
                            <button
                                style={styles.editButton}
                                onClick={() => setEditMode(!editMode)}
                            >
                                {editMode ? '✕ Cancel' : '✏️ Edit'}
                            </button>
                        </div>
                        {editMode ? (
                            <div style={styles.editContainer}>
                                <textarea
                                    style={styles.textarea}
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    rows={4}
                                />
                                <div style={styles.editField}>
                                    <label style={styles.editLabel}>Emphasis Words (comma separated)</label>
                                    <input
                                        style={styles.input}
                                        value={localEmphasis}
                                        onChange={(e) => setLocalEmphasis(e.target.value)}
                                        placeholder="word1, word2, ..."
                                    />
                                </div>
                                <button style={styles.saveButton} onClick={handleSaveEdit}>
                                    💾 Save Changes
                                </button>
                            </div>
                        ) : (
                            <div style={styles.textPreview}>
                                {scene.text || '(No text)'}
                            </div>
                        )}
                    </div>

                    {/* 強調ワード */}
                    {scene.emphasis_words.length > 0 && !editMode && (
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Emphasis Words</div>
                            <div style={styles.tagContainer}>
                                {scene.emphasis_words.map((word, i) => (
                                    <span key={i} style={styles.tag}>{word}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* アセット情報 */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Assets</div>
                        <div style={styles.assetList}>
                            <AssetRow
                                icon="🖼️"
                                label="Image"
                                path={scene.bg_image}
                            />
                            <AssetRow
                                icon="🔊"
                                label="Audio"
                                path={scene.audio}
                            />
                            <AssetRow
                                icon="🎵"
                                label="BGM"
                                path={scene.bgm}
                            />
                        </div>
                    </div>

                    {/* 演出設定 */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Direction</div>
                        <div style={styles.infoGrid}>
                            <InfoRow label="Mood" value={scene.direction.mood || 'calm'} />
                            <InfoRow label="Pacing" value={scene.direction.pacing || 'normal'} />
                            <InfoRow
                                label="Importance"
                                value={scene.direction.importance || 'normal'}
                                highlight={scene.direction.importance === 'climax'}
                            />
                            <InfoRow
                                label="Transition"
                                value={scene.transition.type}
                            />
                        </div>
                    </div>

                    {/* タイトル */}
                    {scene.title && (
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Title</div>
                            <div style={styles.titlePreview}>{scene.title}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/** 情報行コンポーネント */
interface InfoRowProps {
    label: string;
    value: string;
    color?: string;
    highlight?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, color, highlight }) => (
    <div style={styles.infoRow}>
        <span style={styles.infoLabel}>{label}</span>
        <span style={{
            ...styles.infoValue,
            color: color || (highlight ? '#ff3b30' : '#fff'),
            fontWeight: highlight ? 700 : 500
        }}>
            {value}
        </span>
    </div>
);

/** アセット行コンポーネント */
interface AssetRowProps {
    icon: string;
    label: string;
    path: string;
}

const AssetRow: React.FC<AssetRowProps> = ({ icon, label, path }) => (
    <div style={styles.assetRow}>
        <span style={styles.assetIcon}>{icon}</span>
        <span style={styles.assetLabel}>{label}</span>
        <span style={styles.assetPath}>{path}</span>
    </div>
);

/** スタイル定義 */
const styles: Record<string, React.CSSProperties> = {
    container: {
        position: 'fixed',
        top: 20,
        right: 20,
        width: 320,
        maxHeight: 'calc(100vh - 40px)',
        backgroundColor: 'rgba(20, 20, 25, 0.95)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        fontFamily: 'Inter, "Noto Sans JP", sans-serif',
        fontSize: 13,
        color: '#fff',
        overflow: 'hidden',
        zIndex: 10000,
        backdropFilter: 'blur(10px)'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(135deg, rgba(255,59,48,0.2) 0%, transparent 100%)'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
    },
    logo: {
        fontSize: 18
    },
    title: {
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: '0.5px'
    },
    toggleButton: {
        background: 'none',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        padding: '4px 8px',
        fontSize: 12,
        opacity: 0.7
    },
    content: {
        padding: 16,
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 120px)'
    },
    navigation: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    navButton: {
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: 6,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
        transition: 'background 0.2s'
    },
    sceneCounter: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 4
    },
    currentScene: {
        fontSize: 24,
        fontWeight: 800,
        color: '#ff3b30'
    },
    separator: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.4)'
    },
    totalScenes: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)'
    },
    progressContainer: {
        marginBottom: 16
    },
    progressLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 6
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #ff3b30, #ff6b5b)',
        borderRadius: 2,
        transition: 'width 0.1s'
    },
    section: {
        marginBottom: 16,
        padding: 12,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.05)'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: 8
    },
    infoGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    infoLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12
    },
    infoValue: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 500
    },
    textPreview: {
        fontSize: 13,
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.9)',
        whiteSpace: 'pre-wrap'
    },
    tagContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6
    },
    tag: {
        padding: '4px 10px',
        background: 'rgba(255,59,48,0.2)',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        color: '#ff6b5b'
    },
    assetList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    },
    assetRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11
    },
    assetIcon: {
        fontSize: 14
    },
    assetLabel: {
        color: 'rgba(255,255,255,0.5)',
        width: 50
    },
    assetPath: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'monospace',
        fontSize: 10,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1
    },
    titlePreview: {
        fontSize: 14,
        fontWeight: 600,
        color: '#fff'
    },
    editButton: {
        padding: '4px 10px',
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: 4,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 11
    },
    editContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
    },
    textarea: {
        width: '100%',
        padding: 10,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 6,
        color: '#fff',
        fontSize: 13,
        fontFamily: 'inherit',
        resize: 'vertical',
        outline: 'none'
    },
    editField: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4
    },
    editLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)'
    },
    input: {
        width: '100%',
        padding: 8,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 6,
        color: '#fff',
        fontSize: 12,
        fontFamily: 'inherit',
        outline: 'none'
    },
    saveButton: {
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #ff3b30 0%, #ff6b5b 100%)',
        border: 'none',
        borderRadius: 6,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 700
    }
};

export default EditPanel;
