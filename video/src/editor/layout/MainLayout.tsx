import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import {
    Plus, Play, Pause, Grid3X3, MoreHorizontal,
    Save, Trash2, CheckSquare, Square
} from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { CaptionBlock } from '../components/CaptionBlock';
import { PreviewTransformOverlay } from '../components/PreviewTransformOverlay';
import { EditorPreview } from '../../remotion/compositions/EditorPreview';
import styles from './MainLayout.module.css';

export const MainLayout: React.FC = () => {
    const {
        blocks, addBlock, saveAndGenerate, isLoading,
        selectAll, updateBlock, removeSelected, getSelectedCount
    } = useEditorStore();
    const playerRef = React.useRef<PlayerRef>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const videoContainerRef = React.useRef<HTMLDivElement>(null);

    // Playback state
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [playbackRate, setPlaybackRate] = React.useState(1);

    // Resizable pane state
    const [previewWidth, setPreviewWidth] = React.useState(340);
    const [isResizing, setIsResizing] = React.useState(false);

    // Video container dimensions for transform overlay
    const [videoContainerSize, setVideoContainerSize] = useState({ width: 0, height: 0 });

    const activeBlock = blocks.find(b => b.isSelected);
    const selectedCount = blocks.filter(b => b.isSelected).length;

    // Track video container size
    useEffect(() => {
        const updateSize = () => {
            if (videoContainerRef.current) {
                const rect = videoContainerRef.current.getBoundingClientRect();
                setVideoContainerSize({ width: rect.width, height: rect.height });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);

        // Also update when previewWidth changes
        const observer = new ResizeObserver(updateSize);
        if (videoContainerRef.current) {
            observer.observe(videoContainerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateSize);
            observer.disconnect();
        };
    }, [previewWidth]);

    // Handle transform updates for active block
    const handleTransformUpdate = useCallback((updates: { imageX?: number; imageY?: number; imageScale?: number; imageRotation?: number }) => {
        if (activeBlock) {
            updateBlock(activeBlock.id, updates);
        }
    }, [activeBlock, updateBlock]);

    // Calculate total duration
    const totalDurationInSeconds = blocks.reduce((acc, block) => acc + block.durationInSeconds, 0);
    const fps = 30;
    const durationInFrames = Math.ceil(Math.max(totalDurationInSeconds, 1) * fps);

    // Create stable inputProps for Player - spread to create new reference when blocks change
    const playerInputProps = useMemo(() => ({ blocks: [...blocks] as typeof blocks }), [blocks]);

    // Handle Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + A: Select All
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                const activeElement = document.activeElement as HTMLElement;
                const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
                if (!isInput) {
                    e.preventDefault();
                    selectAll(true);
                }
            }
            // Escape: Deselect All
            if (e.key === 'Escape') {
                selectAll(false);
            }
            // Space: Play/Pause
            if (e.key === ' ' && e.target === document.body) {
                e.preventDefault();
                togglePlayback();
            }
            // Delete/Backspace: Delete selected
            if ((e.key === 'Delete' || e.key === 'Backspace') && e.target === document.body) {
                e.preventDefault();
                if (selectedCount > 0) {
                    removeSelected();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectAll, isPlaying, selectedCount, removeSelected]);

    // Update current time from player
    React.useEffect(() => {
        const player = playerRef.current;
        if (!player) return;

        const interval = setInterval(() => {
            const frame = player.getCurrentFrame();
            setCurrentTime(frame / fps);
        }, 100);

        return () => clearInterval(interval);
    }, [fps]);

    // Playback controls
    const togglePlayback = useCallback(() => {
        if (playerRef.current) {
            if (isPlaying) {
                playerRef.current.pause();
            } else {
                playerRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    const changePlaybackRate = () => {
        const rates = [0.5, 1, 1.5, 2];
        const currentIndex = rates.indexOf(playbackRate);
        const nextRate = rates[(currentIndex + 1) % rates.length];
        setPlaybackRate(nextRate);
    };

    // Handle block focus/click -> Seek video
    const handleBlockFocus = useCallback((index: number) => {
        // Calculate target frame
        let targetFrame = 0;
        for (let i = 0; i < index; i++) {
            targetFrame += Math.ceil(blocks[i].durationInSeconds * fps);
        }

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            if (playerRef.current) {
                playerRef.current.seekTo(targetFrame);
                playerRef.current.pause();
                setIsPlaying(false);
                setCurrentTime(targetFrame / fps);
            }
        });
    }, [blocks, fps]);

    // Play single block
    const playBlock = useCallback((index: number) => {
        let startFrame = 0;
        for (let i = 0; i < index; i++) {
            startFrame += Math.ceil(blocks[i].durationInSeconds * fps);
        }

        requestAnimationFrame(() => {
            if (playerRef.current) {
                playerRef.current.seekTo(startFrame);
                playerRef.current.play();
                setIsPlaying(true);
            }
        });
    }, [blocks, fps]);

    // Format time display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Select block exclusively (single selection mode)
    const selectBlockExclusive = (blockId: string, additive: boolean = false) => {
        if (!additive) {
            // Single selection: deselect others
            blocks.forEach(b => {
                if (b.id !== blockId && b.isSelected) {
                    updateBlock(b.id, { isSelected: false });
                }
            });
        }
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            updateBlock(blockId, { isSelected: !additive || !block.isSelected });
        }
    };

    // Toggle all selection
    const handleToggleSelectAll = () => {
        const allSelected = blocks.every(b => b.isSelected);
        selectAll(!allSelected);
    };

    // Resize handlers
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;

        // Clamp between min and max widths
        const clampedWidth = Math.min(Math.max(newWidth, 250), 600);
        setPreviewWidth(clampedWidth);
    }, [isResizing]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
    }, []);

    // Add mouse event listeners for resize
    React.useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    return (
        <div className={styles.container} ref={containerRef}>
            {/* Left Panel - Preview */}
            <div className={styles.previewPane} style={{ width: previewWidth }}>
                {/* Video Preview */}
                <div className={styles.videoContainer} ref={videoContainerRef}>
                    <Player
                        ref={playerRef}
                        component={EditorPreview as React.ComponentType<any>}
                        inputProps={playerInputProps}
                        durationInFrames={durationInFrames}
                        compositionWidth={1080}
                        compositionHeight={1920}
                        fps={fps}
                        style={{ width: '100%', height: '100%' }}
                    />
                    {/* Transform Overlay */}
                    {activeBlock?.image && (
                        <PreviewTransformOverlay
                            block={activeBlock}
                            onUpdate={handleTransformUpdate}
                            containerWidth={videoContainerSize.width}
                            containerHeight={videoContainerSize.height}
                        />
                    )}
                </div>

                {/* Progress Bar */}
                <div className={styles.progressContainer}>
                    <div
                        className={styles.progressBar}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const percent = (e.clientX - rect.left) / rect.width;
                            const targetFrame = Math.floor(percent * durationInFrames);
                            playerRef.current?.seekTo(targetFrame);
                            setCurrentTime(targetFrame / fps);
                        }}
                    >
                        <div
                            className={styles.progressFill}
                            style={{ width: `${(currentTime / totalDurationInSeconds) * 100}%` }}
                        />
                        <div
                            className={styles.progressThumb}
                            style={{ left: `${(currentTime / totalDurationInSeconds) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Playback Controls */}
                <div className={styles.playbackControls}>
                    <button className={styles.playBtn} onClick={togglePlayback}>
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>

                    <div className={styles.timeDisplay}>
                        <span>{formatTime(currentTime)}</span>
                        <span className={styles.timeSeparator}>/</span>
                        <span>{formatTime(totalDurationInSeconds)}</span>
                    </div>

                    <div className={styles.controlsSpacer} />

                    <button className={styles.controlBtn} onClick={changePlaybackRate}>
                        {playbackRate}x
                    </button>

                    <button className={styles.controlBtn} title="グリッド">
                        <Grid3X3 size={16} />
                    </button>

                    <button className={styles.controlBtn} title="その他">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Resizable Divider */}
            <div
                className={`${styles.resizer} ${isResizing ? styles.resizerActive : ''}`}
                onMouseDown={handleResizeStart}
            >
                <div className={styles.resizerHandle} />
            </div>

            {/* Right Panel - Editor */}
            <div className={styles.editorPane}>
                <header className={styles.header}>
                    <h1 className={styles.logo}>
                        VisionForgeS
                        <span className={styles.version}>v{__APP_VERSION__}</span>
                    </h1>
                    <button
                        className={styles.saveBtn}
                        onClick={() => saveAndGenerate()}
                        disabled={isLoading}
                    >
                        <Save size={16} />
                        {isLoading ? '生成中...' : '保存'}
                    </button>
                </header>

                {/* Selection Toolbar */}
                <div className={styles.toolbar}>
                    <button
                        className={styles.toolbarBtn}
                        onClick={handleToggleSelectAll}
                        title="すべて選択 (Ctrl+A)"
                    >
                        {blocks.every(b => b.isSelected) ? (
                            <CheckSquare size={16} />
                        ) : (
                            <Square size={16} />
                        )}
                        <span>全選択</span>
                    </button>

                    {selectedCount > 0 && (
                        <>
                            <div className={styles.toolbarDivider} />
                            <span className={styles.selectionCount}>
                                {selectedCount}件選択中
                            </span>
                            <button
                                className={styles.toolbarBtnDanger}
                                onClick={() => removeSelected()}
                                title="選択項目を削除 (Delete)"
                            >
                                <Trash2 size={16} />
                                <span>削除</span>
                            </button>
                        </>
                    )}

                    <div className={styles.toolbarSpacer} />

                    <span className={styles.blockCount}>
                        {blocks.length}クリップ
                    </span>
                </div>

                <div className={styles.blockList}>
                    {blocks.map((block, index) => (
                        <CaptionBlock
                            key={block.id}
                            block={block}
                            index={index}
                            onFocus={() => {
                                selectBlockExclusive(block.id);
                                handleBlockFocus(index);
                            }}
                            onPlay={() => playBlock(index)}
                        />
                    ))}

                    <button className={styles.addBtn} onClick={() => addBlock()}>
                        <Plus size={18} />
                        <span>クリップを追加</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
