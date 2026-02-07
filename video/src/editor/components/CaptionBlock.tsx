import React, { useRef, useMemo } from 'react';
import {
    Trash2, Play, Edit3, Link2, MoreHorizontal,
    User, Image as ImageIcon, MessageSquare, Copy, Clock
} from 'lucide-react';
import { EditorBlock, getSpeakerConfig, SPEAKERS, getBlockImages, ImageLayer, MAX_IMAGES_PER_BLOCK } from '../types';
import { useEditorStore } from '../store/editorStore';
import { uploadImageAsBase64 } from '../api';
import styles from './CaptionBlock.module.css';

interface Props {
    block: EditorBlock;
    index: number;
    onFocus: () => void;
    onPlay: () => void;
}

// Simple Japanese text tokenizer (splits on common boundaries)
const tokenizeText = (text: string): string[] => {
    if (!text) return [];
    const tokens: string[] = [];
    let current = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        current += char;

        const particles = ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'へ', 'から', 'まで', 'より', 'など'];
        const punctuation = ['、', '。', '！', '？', '・', '「', '」', '『', '』', '（', '）'];

        let shouldSplit = false;

        if (i < text.length - 1) {
            const twoChar = char + text[i + 1];
            if (particles.includes(twoChar)) {
                current += text[i + 1];
                i++;
                shouldSplit = true;
            }
        }

        if (!shouldSplit && particles.includes(char)) {
            shouldSplit = true;
        }

        if (punctuation.includes(char)) {
            shouldSplit = true;
        }

        if (current.length >= 4 && !shouldSplit) {
            shouldSplit = true;
        }

        if (shouldSplit && current.trim()) {
            tokens.push(current.trim());
            current = '';
        }
    }

    if (current.trim()) {
        tokens.push(current.trim());
    }

    return tokens;
};

export const CaptionBlock: React.FC<Props> = ({ block, index, onFocus, onPlay }) => {
    const { updateBlock, removeBlock, duplicateBlock, removeSpansForImage } = useEditorStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [showDurationEdit, setShowDurationEdit] = React.useState(false);

    const speakerConfig = getSpeakerConfig(block.speaker);
    const tokens = useMemo(() => tokenizeText(block.text), [block.text]);

    // Get current images (handles legacy format)
    const currentImages = useMemo(() => getBlockImages(block), [block]);
    const canAddImage = currentImages.length < MAX_IMAGES_PER_BLOCK;

    // Add new image to the block
    const addImageToBlock = async (url: string) => {
        const newImage: ImageLayer = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            src: url,
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
        };

        // If this is the first image and we have legacy format, update to new format
        if (currentImages.length === 0) {
            updateBlock(block.id, {
                images: [newImage],
                selectedImageId: newImage.id,
                image: undefined, // Clear legacy field
                imageX: undefined,
                imageY: undefined,
                imageScale: undefined,
                imageRotation: undefined,
            });
        } else if (currentImages.length < MAX_IMAGES_PER_BLOCK) {
            // Convert legacy to new format if needed, then add
            const existingImages = currentImages.map(img => ({
                id: img.id === 'legacy-image' ? `img-${Date.now()}-legacy` : img.id,
                src: img.src,
                x: img.x,
                y: img.y,
                scale: img.scale,
                rotation: img.rotation,
            }));
            updateBlock(block.id, {
                images: [...existingImages, newImage],
                selectedImageId: newImage.id,
                image: undefined,
                imageX: undefined,
                imageY: undefined,
                imageScale: undefined,
                imageRotation: undefined,
            });
        }
    };

    // Remove image from block
    const removeImageFromBlock = (imageId: string) => {
        removeSpansForImage(block.id, imageId);
        const updatedImages = currentImages.filter(img => img.id !== imageId);
        if (imageId === 'legacy-image') {
            updateBlock(block.id, {
                image: undefined,
                imageX: undefined,
                imageY: undefined,
                imageScale: undefined,
                imageRotation: undefined,
                images: updatedImages.length > 0 ? updatedImages : undefined,
            });
        } else {
            updateBlock(block.id, { images: updatedImages.length > 0 ? updatedImages : undefined });
        }
    };

    // Toggle selection (for multi-select with Ctrl/Cmd)
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        updateBlock(block.id, { isSelected: e.target.checked });
    };

    // Handle file selection
    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && canAddImage) {
            try {
                const url = await uploadImageAsBase64(file);
                addImageToBlock(url);
            } catch (error) {
                console.error("Image upload failed", error);
            }
        }
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle paste events
    const handlePaste = async (e: React.ClipboardEvent) => {
        if (!canAddImage) return;
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    try {
                        const url = await uploadImageAsBase64(blob);
                        addImageToBlock(url);
                        e.preventDefault();
                    } catch (error) {
                        console.error("Image upload failed", error);
                    }
                }
                break;
            }
        }
    };

    // Drag and Drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (!canAddImage) return;
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            try {
                const url = await uploadImageAsBase64(file);
                addImageToBlock(url);
            } catch (error) {
                console.error("Image upload failed", error);
            }
        }
    };

    // Duplicate block
    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        duplicateBlock(block.id);
    };

    // Double click to edit
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    return (
        <div
            className={`${styles.container} ${isDragging ? styles.dragging : ''} ${block.isSelected ? styles.selected : ''}`}
            onPaste={handlePaste}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={onFocus}
        >
            {/* Block Number & Checkbox */}
            <div className={styles.blockIndex}>
                <span className={styles.blockNumber}>{index + 1}</span>
                <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={!!block.isSelected}
                    onChange={handleCheckboxChange}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Top Row: Speaker + Tokens + Actions */}
                <div className={styles.topRow}>
                    {/* Speaker Selector */}
                    <div className={styles.speakerChip} style={{ borderColor: speakerConfig.color }}>
                        <User size={12} style={{ color: speakerConfig.color }} />
                        <select
                            value={block.speaker}
                            onChange={(e) => updateBlock(block.id, { speaker: e.target.value })}
                            className={styles.speakerSelect}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {SPEAKERS.map(s => (
                                <option key={s.id} value={s.id}>{s.displayName}</option>
                            ))}
                        </select>
                        <MoreHorizontal size={12} className={styles.speakerMore} />
                    </div>

                    {/* Word Tokens */}
                    <div className={styles.tokenList}>
                        {tokens.map((token, i) => (
                            <span key={i} className={styles.token}>{token}</span>
                        ))}
                    </div>

                    {/* Edit Button */}
                    <button
                        className={styles.actionBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(!isEditing);
                        }}
                        title="編集"
                    >
                        <Edit3 size={14} />
                    </button>
                </div>

                {/* Middle Row: Image Thumbnails + Caption Text */}
                <div className={styles.middleRow}>
                    {/* Image Thumbnails Container */}
                    <div className={styles.thumbnailContainer}>
                        {currentImages.map((img, imgIndex) => (
                            <div
                                key={img.id}
                                className={`${styles.thumbnail} ${block.selectedImageId === img.id ? styles.thumbnailSelected : ''}`}
                                style={{ backgroundImage: `url(${img.src})` }}
                                title={`画像 ${imgIndex + 1}${block.selectedImageId === img.id ? ' (選択中)' : ' - クリックで選択'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateBlock(block.id, {
                                        selectedImageId: block.selectedImageId === img.id ? undefined : img.id
                                    });
                                }}
                            >
                                <button
                                    className={styles.thumbnailRemove}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeImageFromBlock(img.id);
                                    }}
                                    title="画像を削除"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        ))}
                        {/* Add Image Button */}
                        {canAddImage && (
                            <div
                                className={`${styles.thumbnail} ${styles.thumbnailAdd}`}
                                onClick={handleImageClick}
                                title={currentImages.length === 0 ? '画像を追加' : '2枚目の画像を追加'}
                            >
                                <ImageIcon size={16} color="#555" />
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className={styles.hiddenInput}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Caption / Subtitle */}
                    <div className={styles.captionArea} onDoubleClick={handleDoubleClick}>
                        <MessageSquare size={14} className={styles.captionIcon} />
                        {isEditing ? (
                            <textarea
                                className={styles.captionInput}
                                value={block.text}
                                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                                onBlur={() => setIsEditing(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        setIsEditing(false);
                                    }
                                    if (e.key === 'Escape') {
                                        setIsEditing(false);
                                    }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                rows={2}
                            />
                        ) : (
                            <span
                                className={styles.captionText}
                                style={{ color: speakerConfig.color }}
                            >
                                {block.text || 'テキストを入力...'}
                            </span>
                        )}
                    </div>

                    {/* Duration Badge */}
                    <div
                        className={styles.durationBadge}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDurationEdit(!showDurationEdit);
                        }}
                        title="再生時間を編集"
                    >
                        <Clock size={10} />
                        {showDurationEdit ? (
                            <input
                                type="number"
                                step="0.1"
                                min="0.5"
                                max="30"
                                value={block.durationInSeconds}
                                onChange={(e) => updateBlock(block.id, { durationInSeconds: parseFloat(e.target.value) || 2 })}
                                onBlur={() => setShowDurationEdit(false)}
                                onClick={(e) => e.stopPropagation()}
                                className={styles.durationInput}
                                autoFocus
                            />
                        ) : (
                            <span>{block.durationInSeconds.toFixed(1)}s</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Actions */}
            <div className={styles.rightActions}>
                {/* Play Button */}
                <button
                    className={styles.playBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        onPlay();
                    }}
                    title="このクリップを再生"
                >
                    <Play size={16} fill="currentColor" />
                </button>

                {/* Duplicate Button */}
                <button
                    className={styles.actionBtnSmall}
                    onClick={handleDuplicate}
                    title="複製"
                >
                    <Copy size={12} />
                </button>

                {/* Link Icon */}
                <button className={styles.linkBtn} title="リンク">
                    <Link2 size={14} />
                </button>

                {/* Delete (shown on hover) */}
                <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        removeBlock(block.id);
                    }}
                    title="削除"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};
