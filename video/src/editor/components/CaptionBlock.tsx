import React, { useRef } from 'react';
import { Trash2, GripVertical, Clock, User, Image as ImageIcon } from 'lucide-react';
import { EditorBlock } from '../types';
import { useEditorStore } from '../store/editorStore';
import styles from './CaptionBlock.module.css';

interface Props {
    block: EditorBlock;
    index: number;
}

export const CaptionBlock: React.FC<Props> = ({ block, index }) => {
    const { updateBlock, removeBlock } = useEditorStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    // Handle file selection via dialog
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            updateBlock(block.id, { image: url });
        }
    };

    // Handle paste events (Ctrl+V)
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    updateBlock(block.id, { image: url });
                    e.preventDefault(); // Prevent pasting the file name into text area if focused there
                }
                break;
            }
        }
    };

    // Drag and Drop Handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            updateBlock(block.id, { image: url });
        }
    };

    return (
        <div
            className={`${styles.container} ${isDragging ? styles.dragging : ''} ${block.isSelected ? styles.selected : ''}`}
            onPaste={handlePaste}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={styles.wrapper}>
                {/* Leftmost: Selection Checkbox */}
                <div className={styles.selectionArea}>
                    <div className={styles.indexNum}>{index + 1}</div>
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={!!block.isSelected}
                        onChange={() => updateBlock(block.id, { isSelected: !block.isSelected })}
                    />
                </div>

                {/* Left: Image Thumbnail / Picker */}
                <div
                    className={styles.imageArea}
                    onClick={handleImageClick}
                    style={{ backgroundImage: block.image ? `url(${block.image})` : 'none' }}
                    title="クリックして画像を選択、または画像を貼り付け、D&D"
                >
                    {!block.image && <ImageIcon size={24} color="#666" />}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className={styles.hiddenInput}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Right: Content */}
                <div className={styles.contentArea}>
                    <div className={styles.headerRow}>
                        <div className={styles.leftGroup}>
                            <div className={styles.speakerSelector}>
                                <User size={14} className={styles.speakerIcon} />
                                <select
                                    value={block.speaker}
                                    onChange={(e) => updateBlock(block.id, { speaker: e.target.value })}
                                    className={styles.selectInput}
                                >
                                    <option value="kanon">雨晴はう (Kanon)</option>
                                    <option value="zundamon">ずんだもん</option>
                                    <option value="metan">四国めたん</option>
                                    <option value="tsumugi">春日部つむぎ</option>
                                </select>
                            </div>
                            <div className={styles.durationChip}>
                                <Clock size={14} />
                                <span>{block.durationInSeconds.toFixed(2)}s</span>
                            </div>
                        </div>

                        <button
                            className={styles.deleteBtn}
                            onClick={() => removeBlock(block.id)}
                            aria-label="Delete block"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className={styles.bodyRow}>
                        <textarea
                            className={styles.input}
                            value={block.text}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                            placeholder="テキストを入力..."
                            rows={1}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
