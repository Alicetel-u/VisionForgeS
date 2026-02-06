import React from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { Plus } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { CaptionBlock } from '../components/CaptionBlock';
import { EditorPreview } from '../../remotion/compositions/EditorPreview';
import styles from './MainLayout.module.css';

export const MainLayout: React.FC = () => {
    const { blocks, addBlock, loadScript, saveAndGenerate, isLoading, selectAll } = useEditorStore();
    const playerRef = React.useRef<PlayerRef>(null);

    // Load script removed to use persisted state

    // Handle Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl + A: Select All
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                const activeElement = document.activeElement as HTMLElement;
                const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

                // Only select all blocks if not typing in a text field
                if (!isInput) {
                    e.preventDefault();
                    selectAll(true);
                }
            }
            // Esc: Deselect All (Optional helpful feature)
            if (e.key === 'Escape') {
                selectAll(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectAll]);

    // Calculate total duration
    const totalDurationInSeconds = blocks.reduce((acc, block) => acc + block.durationInSeconds, 0);
    const fps = 30; // Default FPS
    const durationInFrames = Math.ceil(Math.max(totalDurationInSeconds, 1) * fps);

    // Handle block focus/click -> Seek video
    const handleBlockFocus = (index: number) => {
        if (playerRef.current) {
            // Calculate start frame for this block accurately matching EditorPreview logic
            let currentFrame = 0;
            for (let i = 0; i < index; i++) {
                const durationInFrames = Math.ceil(blocks[i].durationInSeconds * fps);
                currentFrame += durationInFrames;
            }

            playerRef.current.seekTo(currentFrame);
            playerRef.current.pause();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.editorPane}>
                <header className={styles.header}>
                    <h1>
                        VisionForgeS Editor
                        <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
                            v{__APP_VERSION__}
                        </span>
                    </h1>
                    <button
                        className={styles.saveBtn}
                        onClick={() => saveAndGenerate()}
                        disabled={isLoading}
                    >
                        {isLoading ? '生成中...' : '音声生成・保存'}
                    </button>
                </header>

                <div className={styles.contentArea}>
                    {blocks.map((block, index) => (
                        <CaptionBlock
                            key={block.id}
                            block={block}
                            index={index}
                            onFocus={() => handleBlockFocus(index)}
                        />
                    ))}

                    <button className={styles.addBtn} onClick={() => addBlock()}>
                        <Plus size={20} />
                        <span>行を追加</span>
                    </button>
                </div>
            </div>

            <div className={styles.previewPane}>
                <div className={styles.playerWrapper}>
                    <Player
                        ref={playerRef}
                        component={EditorPreview}
                        inputProps={{ blocks }}
                        durationInFrames={durationInFrames}
                        compositionWidth={1080}
                        compositionHeight={1920}
                        fps={fps}
                        style={{ width: '100%', height: '100%' }}
                        controls
                        autoPlay
                    />
                </div>
                <div className={styles.previewInfo}>
                    Total: {totalDurationInSeconds.toFixed(1)}s ({durationInFrames} frames)
                </div>
            </div>
        </div>
    );
};
