import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { Move, ZoomIn, RotateCw, RotateCcw, Crosshair } from 'lucide-react';
import styles from './TransformControls.module.css';

export const TransformControls: React.FC = () => {
    const { blocks, updateBlock } = useEditorStore();
    const selectedBlock = blocks.find(b => b.isSelected);

    if (!selectedBlock || !selectedBlock.image) return null;

    const currentX = selectedBlock.imageX || 0;
    const currentY = selectedBlock.imageY || 0;
    const currentScale = selectedBlock.imageScale || 1;
    const currentRotation = selectedBlock.imageRotation || 0;

    const handleReset = () => {
        updateBlock(selectedBlock.id, {
            imageX: 0,
            imageY: 0,
            imageScale: 1,
            imageRotation: 0
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.title}>画像調整</span>
                <button onClick={handleReset} className={styles.resetBtn} title="リセット">
                    <Crosshair size={12} />
                </button>
            </div>

            {/* Position */}
            <div className={styles.controlRow}>
                <Move size={12} className={styles.icon} />
                <div className={styles.inputGroup}>
                    <label>X</label>
                    <input
                        type="range"
                        min="-500"
                        max="500"
                        value={currentX}
                        onChange={(e) => updateBlock(selectedBlock.id, { imageX: parseInt(e.target.value) })}
                        className={styles.slider}
                    />
                    <span className={styles.value}>{Math.round(currentX)}</span>
                </div>
            </div>

            <div className={styles.controlRow}>
                <div className={styles.iconPlaceholder} />
                <div className={styles.inputGroup}>
                    <label>Y</label>
                    <input
                        type="range"
                        min="-500"
                        max="500"
                        value={currentY}
                        onChange={(e) => updateBlock(selectedBlock.id, { imageY: parseInt(e.target.value) })}
                        className={styles.slider}
                    />
                    <span className={styles.value}>{Math.round(currentY)}</span>
                </div>
            </div>

            {/* Scale */}
            <div className={styles.controlRow}>
                <ZoomIn size={12} className={styles.icon} />
                <div className={styles.inputGroup}>
                    <label>拡大</label>
                    <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.05"
                        value={currentScale}
                        onChange={(e) => updateBlock(selectedBlock.id, { imageScale: parseFloat(e.target.value) })}
                        className={styles.slider}
                    />
                    <span className={styles.value}>{currentScale.toFixed(1)}x</span>
                </div>
            </div>

            {/* Rotation */}
            <div className={styles.controlRow}>
                <RotateCw size={12} className={styles.icon} />
                <div className={styles.inputGroup}>
                    <label>回転</label>
                    <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={currentRotation}
                        onChange={(e) => updateBlock(selectedBlock.id, { imageRotation: parseFloat(e.target.value) })}
                        className={styles.slider}
                    />
                    <span className={styles.value}>{Math.round(currentRotation)}°</span>
                </div>
            </div>

            {/* Quick Rotation Buttons */}
            <div className={styles.quickActions}>
                <button
                    onClick={() => updateBlock(selectedBlock.id, { imageRotation: currentRotation - 90 })}
                    title="-90°"
                >
                    <RotateCcw size={12} />
                </button>
                <button
                    onClick={() => updateBlock(selectedBlock.id, { imageRotation: 0 })}
                    className={currentRotation === 0 ? styles.active : ''}
                >
                    0°
                </button>
                <button
                    onClick={() => updateBlock(selectedBlock.id, { imageRotation: currentRotation + 90 })}
                    title="+90°"
                >
                    <RotateCw size={12} />
                </button>
            </div>
        </div>
    );
};
