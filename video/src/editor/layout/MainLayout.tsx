import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import {
    Plus, Play, Pause, Grid3X3, MoreHorizontal,
    Save, Trash2, CheckSquare, Square, RotateCcw,
    AudioLines, Merge, Download, X
} from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { CaptionBlock } from '../components/CaptionBlock';
import { PreviewTransformOverlay } from '../components/PreviewTransformOverlay';
import { ImageSpanOverlay } from '../components/ImageSpanOverlay';
import { EditorPreview } from '../../remotion/compositions/EditorPreview';
import { ImageLayer, getBlockImages } from '../types';
import { startRender, getRenderStatus, getRenderDownloadUrl, RenderStatus } from '../api';
import styles from './MainLayout.module.css';

export const MainLayout: React.FC = () => {
    const {
        blocks, imageSpans, addBlock, saveOnly, generateAllAudio, isLoading,
        selectAll, updateBlock, removeSelected, getSelectedCount,
        loadScript, canMergeSelected, mergeSelected, generateAudioForSelected
    } = useEditorStore();

    // ...


    const playerRef = React.useRef<PlayerRef>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const videoContainerRef = React.useRef<HTMLDivElement>(null);

    // Playback state
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [playbackRate, setPlaybackRate] = React.useState(1);



    // Video container dimensions for transform overlay
    const [videoContainerSize, setVideoContainerSize] = useState({ width: 0, height: 0 });

    // Export state
    const [renderStatus, setRenderStatus] = useState<RenderStatus>({ status: 'idle', progress: 0 });
    const [showExportBar, setShowExportBar] = useState(false);

    const activeBlock = blocks.find(b => b.isSelected);
    const selectedCount = blocks.filter(b => b.isSelected).length;

    // Handle export
    const handleExport = useCallback(async () => {
        try {
            setShowExportBar(true);
            setRenderStatus({ status: 'rendering', progress: 0 });
            await startRender(blocks, imageSpans);

            // Poll for status
            const pollInterval = setInterval(async () => {
                try {
                    const status = await getRenderStatus();
                    setRenderStatus(status);
                    if (status.status === 'done' || status.status === 'error') {
                        clearInterval(pollInterval);
                    }
                } catch {
                    clearInterval(pollInterval);
                    setRenderStatus({ status: 'error', progress: 0, error: 'Connection lost' });
                }
            }, 1000);
        } catch (e: any) {
            setRenderStatus({ status: 'error', progress: 0, error: e.message });
        }
    }, [blocks, imageSpans]);

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
    }, []);

    // Handle image updates for multi-image support
    const handleUpdateImage = useCallback((imageId: string, updates: Partial<ImageLayer>) => {
        if (!activeBlock) return;

        const currentImages = getBlockImages(activeBlock);
        const updatedImages = currentImages.map(img =>
            img.id === imageId ? { ...img, ...updates } : img
        );

        // Also update legacy fields if it's the legacy image
        if (imageId === 'legacy-image') {
            updateBlock(activeBlock.id, {
                imageX: updates.x ?? activeBlock.imageX,
                imageY: updates.y ?? activeBlock.imageY,
                imageScale: updates.scale ?? activeBlock.imageScale,
                imageRotation: updates.rotation ?? activeBlock.imageRotation,
            });
        } else {
            updateBlock(activeBlock.id, { images: updatedImages });
        }
    }, [activeBlock, updateBlock]);

    // Handle image selection
    const handleSelectImage = useCallback((imageId: string | undefined) => {
        if (activeBlock) {
            updateBlock(activeBlock.id, { selectedImageId: imageId });
        }
    }, [activeBlock, updateBlock]);

    // Calculate total duration
    const totalDurationInSeconds = blocks.reduce((acc, block) => acc + block.durationInSeconds, 0);
    const fps = 30;
    const durationInFrames = Math.ceil(Math.max(totalDurationInSeconds, 1) * fps);

    const blockListRef = React.useRef<HTMLDivElement>(null);

    // Create stable inputProps for Player - spread to create new reference when blocks change
    const playerInputProps = useMemo(() => ({
        blocks: [...blocks] as typeof blocks,
        imageSpans: [...imageSpans],
    }), [blocks, imageSpans]);

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

            // Undo/Redo
            if (e.ctrlKey || e.metaKey) {
                // Undo: Ctrl+Z
                if (e.key === 'z') {
                    e.preventDefault();
                    const { undo, redo } = (useEditorStore as any).temporal.getState();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                }
                // Redo: Ctrl+Y
                if (e.key === 'y') {
                    e.preventDefault();
                    const { redo } = (useEditorStore as any).temporal.getState();
                    redo();
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



    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const chunksRef = React.useRef<Blob[]>([]);

    const handleStartRecording = async () => {
        try {
            // @ts-ignore - preferCurrentTab is experimental
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser',
                },
                // @ts-ignore - suppressLocalAudioPlayback is experimental
                audio: {
                    suppressLocalAudioPlayback: false, // Try to capture system audio
                },
                preferCurrentTab: true,
                selfBrowserSurface: 'include',
                systemAudio: 'include',
            });

            const track = stream.getVideoTracks()[0];

            // Region Capture API to crop to the preview container
            // @ts-ignore - window.CropTarget is experimental
            if (window.CropTarget && videoContainerRef.current) {
                try {
                    // @ts-ignore
                    const cropTarget = await window.CropTarget.fromElement(videoContainerRef.current);
                    // @ts-ignore
                    await track.cropTo(cropTarget);
                } catch (e) {
                    console.warn("Region Capture failed", e);
                }
            }

            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `visionforge-preview-${new Date().getTime()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                setIsRecording(false);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Pause player
                if (playerRef.current) {
                    playerRef.current.pause();
                    setIsPlaying(false);
                }
            };

            recorder.start();
            setIsRecording(true);

            // Start playback from beginning
            if (playerRef.current) {
                playerRef.current.seekTo(0);
                // Seek takes a moment, wait briefly before playing
                requestAnimationFrame(() => {
                    playerRef.current?.play();
                    setIsPlaying(true);
                });
            }

        } catch (err) {
            console.error("Recording cancelled or failed", err);
            setIsRecording(false);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    // Auto-stop recording when video ends
    React.useEffect(() => {
        if (isRecording && totalDurationInSeconds > 0) {
            // Stop slightly before the absolute end to ensure we catch it
            // before any potential loop or stop state reset
            if (currentTime >= totalDurationInSeconds - 0.2) {
                handleStopRecording();
            }
        }
    }, [currentTime, isRecording, totalDurationInSeconds]);

    return (
        <div className={styles.container} ref={containerRef}>
            {/* Left Panel - Preview */}
            <div className={styles.previewPane}>
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
                        loop={false}
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                    />

                    {/* Transform Overlay for multi-image support */}
                    {!isRecording && (
                        <PreviewTransformOverlay
                            block={activeBlock}
                            onUpdateImage={handleUpdateImage}
                            onSelectImage={handleSelectImage}
                            containerWidth={videoContainerSize.width}
                            containerHeight={videoContainerSize.height}
                        />
                    )}
                </div>

                {/* Fixed Controls Bar - below video */}
                <div className={styles.controlsBar}>
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
                            {formatTime(currentTime)} / {formatTime(totalDurationInSeconds)}
                        </div>

                        <button
                            className={styles.controlBtn}
                            onClick={() => {
                                if (activeBlock) {
                                    updateBlock(activeBlock.id, {
                                        imageX: 0,
                                        imageY: 0,
                                        imageScale: 1,
                                        imageRotation: 0
                                    });
                                }
                            }}
                            title="画像位置をリセット"
                            disabled={!activeBlock?.image}
                            style={{ marginLeft: '12px' }}
                        >
                            <RotateCcw size={16} />
                            <span style={{ marginLeft: '6px', fontSize: '0.8rem' }}>リセット</span>
                        </button>

                        {/* Layer switcher (when multiple images exist) */}
                        {activeBlock && getBlockImages(activeBlock).length > 1 && (
                            <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                                {getBlockImages(activeBlock).map((image, index) => (
                                    <button
                                        key={image.id}
                                        className={styles.controlBtn}
                                        onClick={() => handleSelectImage(image.id)}
                                        style={{
                                            background: image.id === activeBlock.selectedImageId
                                                ? 'rgba(0, 188, 212, 0.3)' : undefined,
                                            borderColor: image.id === activeBlock.selectedImageId
                                                ? '#00bcd4' : undefined,
                                        }}
                                    >
                                        <span style={{ fontSize: '0.8rem' }}>画像{index + 1}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Right Panel - Editor */}
            <div className={styles.editorPane}>
                <header className={styles.header}>
                    <h1 className={styles.logo}>
                        VisionForgeS
                        <span className={styles.version}>v{__APP_VERSION__}</span>
                    </h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {isRecording ? (
                            <button
                                className={styles.saveBtn}
                                onClick={handleStopRecording}
                                style={{ backgroundColor: '#ef4444', border: '1px solid #dc2626', animation: 'pulse 2s infinite' }}
                                title="録画を停止して保存"
                            >
                                <Square size={16} fill="white" />
                                停止
                            </button>
                        ) : (
                            <button
                                className={styles.saveBtn}
                                onClick={handleStartRecording}
                                disabled={isLoading}
                                style={{ backgroundColor: '#2dd4bf', border: '1px solid #14b8a6', filter: 'hue-rotate(290deg)' }} // Pinkish/Reddish
                                title="プレビュー画面を録画して動画ファイルとして保存します（擬似エクスポート）"
                            >
                                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'white', marginRight: 6 }} />
                                画面録画
                            </button>
                        )}

                        <button
                            className={styles.saveBtn}
                            onClick={() => loadScript()}
                            disabled={isLoading}
                            style={{ backgroundColor: '#2dd4bf', border: '1px solid #14b8a6', filter: 'hue-rotate(180deg)', marginLeft: '10px' }} // Distinct color
                            title="サーバー上のファイルを強制的に再読み込みします"
                        >
                            <RotateCcw size={16} />
                            再読込
                        </button>
                        <button
                            className={styles.saveBtn}
                            onClick={() => saveOnly()}
                            disabled={isLoading}
                            title="テキスト内容をサーバーに保存（一瞬で終わります）"
                        >
                            <Save size={16} />
                            保存
                        </button>
                        <button
                            className={styles.saveBtn}
                            onClick={() => generateAllAudio()}
                            disabled={isLoading}
                            style={{ backgroundColor: '#2dd4bf', border: '1px solid #14b8a6' }} // Separate styling for distinction
                            title="VOICEVOXを使って全音声を生成・更新します（時間がかかります）"
                        >
                            <AudioLines size={16} />
                            全音声生成
                        </button>
                        <button
                            className={styles.saveBtn}
                            onClick={handleExport}
                            disabled={isLoading || renderStatus.status === 'rendering'}
                            style={{ backgroundColor: '#7c3aed', border: '1px solid #6d28d9' }}
                            title="MP4動画としてエクスポートします"
                        >
                            <Download size={16} />
                            エクスポート
                        </button>
                    </div>
                </header>

                {/* Export Progress Bar */}
                {showExportBar && (
                    <div className={styles.exportBar}>
                        <div className={styles.exportInfo}>
                            {renderStatus.status === 'rendering' && (
                                <>
                                    <span className={styles.exportSpinner} />
                                    <span>エクスポート中... {renderStatus.progress}%</span>
                                </>
                            )}
                            {renderStatus.status === 'done' && (
                                <>
                                    <span style={{ color: '#4ade80' }}>完了!</span>
                                    <a
                                        href={getRenderDownloadUrl()}
                                        className={styles.exportDownloadBtn}
                                        download
                                    >
                                        <Download size={14} />
                                        ダウンロード
                                    </a>
                                </>
                            )}
                            {renderStatus.status === 'error' && (
                                <span style={{ color: '#f87171' }}>
                                    エラー: {renderStatus.error || '不明なエラー'}
                                </span>
                            )}
                        </div>
                        <button
                            className={styles.exportCloseBtn}
                            onClick={() => setShowExportBar(false)}
                        >
                            <X size={14} />
                        </button>
                        {renderStatus.status === 'rendering' && (
                            <div className={styles.exportProgressTrack}>
                                <div
                                    className={styles.exportProgressFill}
                                    style={{ width: `${renderStatus.progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}

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
                                className={styles.toolbarBtnAudio}
                                onClick={() => generateAudioForSelected()}
                                disabled={isLoading}
                                title="選択したクリップの音声を生成"
                            >
                                <AudioLines size={16} />
                                <span>音声生成</span>
                            </button>
                            {canMergeSelected() && (
                                <button
                                    className={styles.toolbarBtn}
                                    onClick={() => mergeSelected()}
                                    title="選択した隣接クリップを結合"
                                >
                                    <Merge size={16} />
                                    <span>結合</span>
                                </button>
                            )}
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

                <div className={styles.blockList} ref={blockListRef}>
                    <div style={{ position: 'relative' }}>
                        <ImageSpanOverlay
                            blocks={blocks}
                            imageSpans={imageSpans}
                            blockListRef={blockListRef}
                        />
                        {blocks.map((block, index) => (
                            <div key={block.id} data-block-id={block.id} style={{ paddingLeft: 28 }}>
                                <CaptionBlock
                                    block={block}
                                    index={index}
                                    onFocus={() => {
                                        selectBlockExclusive(block.id);
                                        handleBlockFocus(index);
                                    }}
                                    onPlay={() => playBlock(index)}
                                />
                            </div>
                        ))}

                        <button className={styles.addBtn} onClick={() => addBlock()} style={{ marginLeft: 28 }}>
                            <Plus size={18} />
                            <span>クリップを追加</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
