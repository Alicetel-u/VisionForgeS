import React from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { EditorBlock } from '../types';
import styles from './ClipPanel.module.css';

interface Props {
    blocks: EditorBlock[];
}

export const ClipPanel: React.FC<Props> = ({ blocks }) => {
    // Get the first image from blocks as thumbnail
    const thumbnailBlock = blocks.find(b => b.image);
    const clipCount = blocks.length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.clipTitle}>クリップ1</span>
                <button className={styles.exportBtn} title="エクスポート">
                    <ExternalLink size={14} />
                </button>
            </div>

            <div className={styles.clipInfo}>
                <div
                    className={styles.thumbnail}
                    style={{
                        backgroundImage: thumbnailBlock?.image ? `url(${thumbnailBlock.image})` : 'none'
                    }}
                >
                    {!thumbnailBlock?.image && <ImageIcon size={20} color="#555" />}
                </div>
                <div className={styles.clipMeta}>
                    <span className={styles.clipLabel}>画像</span>
                    <span className={styles.clipValue}>クリップ{clipCount}</span>
                </div>
            </div>
        </div>
    );
};
