import React, { useCallback, useRef, useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { EditorBlock } from '../types';
import styles from './PreviewTransformOverlay.module.css';

interface Props {
    block: EditorBlock | undefined;
    onUpdate: (updates: Partial<EditorBlock>) => void;
    containerWidth: number;
    containerHeight: number;
}

type DragMode = 'move' | 'scale-tl' | 'scale-tr' | 'scale-bl' | 'scale-br' | 'rotate' | null;

// Video composition dimensions
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const VIDEO_ASPECT = VIDEO_WIDTH / VIDEO_HEIGHT; // 0.5625 (9:16)

export const PreviewTransformOverlay: React.FC<Props> = ({
    block,
    onUpdate,
    containerWidth,
    containerHeight
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [dragMode, setDragMode] = useState<DragMode>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialValues, setInitialValues] = useState({
        x: 0, y: 0, scale: 1, rotation: 0
    });

    // Current transform values
    const imageX = block?.imageX ?? 0;
    const imageY = block?.imageY ?? 0;
    const imageScale = block?.imageScale ?? 1;
    const imageRotation = block?.imageRotation ?? 0;

    // Calculate the actual video display area within the container
    // Video is positioned at top-left, maintains aspect ratio, fits within container
    const containerAspect = containerWidth / containerHeight;

    let videoDisplayWidth: number;
    let videoDisplayHeight: number;

    if (containerAspect > VIDEO_ASPECT) {
        // Container is wider than video - video is height-constrained
        videoDisplayHeight = containerHeight;
        videoDisplayWidth = containerHeight * VIDEO_ASPECT;
    } else {
        // Container is taller than video - video is width-constrained
        videoDisplayWidth = containerWidth;
        videoDisplayHeight = containerWidth / VIDEO_ASPECT;
    }

    // Video is positioned at top-left (0, 0)
    const videoOffsetX = 0;
    const videoOffsetY = 0;

    // Scale factor from video coordinates to display coordinates
    const scaleFactor = videoDisplayWidth / VIDEO_WIDTH;

    // Handle mouse down on different elements
    const handleMouseDown = useCallback((e: React.MouseEvent, mode: DragMode) => {
        e.preventDefault();
        e.stopPropagation();
        setDragMode(mode);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialValues({
            x: imageX,
            y: imageY,
            scale: imageScale,
            rotation: imageRotation
        });
    }, [imageX, imageY, imageScale, imageRotation]);

    // Handle mouse move
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragMode) return;

        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        switch (dragMode) {
            case 'move': {
                // Move image - scale delta to video coordinates
                const newX = initialValues.x + deltaX / scaleFactor;
                const newY = initialValues.y + deltaY / scaleFactor;
                onUpdate({ imageX: newX, imageY: newY });
                break;
            }
            case 'scale-tl':
            case 'scale-tr':
            case 'scale-bl':
            case 'scale-br': {
                // Scale image - use diagonal distance for uniform scaling
                const isRight = dragMode.includes('r');
                const isBottom = dragMode.includes('b');
                const dirX = isRight ? 1 : -1;
                const dirY = isBottom ? 1 : -1;

                // Calculate scale based on distance change
                const distance = (deltaX * dirX + deltaY * dirY) / 2;
                const scaleChange = distance / 100; // Sensitivity
                const newScale = Math.max(0.1, Math.min(5, initialValues.scale + scaleChange));
                onUpdate({ imageScale: newScale });
                break;
            }
            case 'rotate': {
                // Rotate image - horizontal drag changes rotation
                const rotationChange = deltaX * 0.5; // 0.5 degrees per pixel
                const newRotation = initialValues.rotation + rotationChange;
                onUpdate({ imageRotation: newRotation });
                break;
            }
        }
    }, [dragMode, dragStart, initialValues, scaleFactor, onUpdate]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        setDragMode(null);
    }, []);

    // Add global mouse listeners when dragging
    useEffect(() => {
        if (dragMode) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = dragMode === 'rotate' ? 'ew-resize' :
                dragMode === 'move' ? 'move' : 'nwse-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [dragMode, handleMouseMove, handleMouseUp]);

    // Reset transform
    const handleReset = useCallback(() => {
        onUpdate({
            imageX: 0,
            imageY: 0,
            imageScale: 1,
            imageRotation: 0
        });
    }, [onUpdate]);

    // Don't render if no block or no image
    if (!block?.image || containerWidth === 0 || containerHeight === 0) {
        return null;
    }

    // The frame should match the video display area exactly
    // Then apply the same transforms as the image
    const frameWidth = videoDisplayWidth;
    const frameHeight = videoDisplayHeight;
    const frameCenterX = videoOffsetX + frameWidth / 2;
    const frameCenterY = videoOffsetY + frameHeight / 2;

    // Calculate frame position with transforms applied
    const transformedX = frameCenterX + (imageX * scaleFactor);
    const transformedY = frameCenterY + (imageY * scaleFactor);

    return (
        <div className={styles.overlay} ref={overlayRef}>
            {/* Transform Frame - matches the video/image bounds */}
            <div
                className={styles.transformFrame}
                style={{
                    width: frameWidth,
                    height: frameHeight,
                    left: transformedX,
                    top: transformedY,
                    transform: `translate(-50%, -50%) rotate(${imageRotation}deg) scale(${imageScale})`,
                }}
            >
                {/* Move Area (center) */}
                <div
                    className={styles.moveArea}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                />

                {/* Corner Handles */}
                <div
                    className={`${styles.cornerHandle} ${styles.topLeft}`}
                    onMouseDown={(e) => handleMouseDown(e, 'scale-tl')}
                />
                <div
                    className={`${styles.cornerHandle} ${styles.topRight}`}
                    onMouseDown={(e) => handleMouseDown(e, 'scale-tr')}
                />
                <div
                    className={`${styles.cornerHandle} ${styles.bottomLeft}`}
                    onMouseDown={(e) => handleMouseDown(e, 'scale-bl')}
                />
                <div
                    className={`${styles.cornerHandle} ${styles.bottomRight}`}
                    onMouseDown={(e) => handleMouseDown(e, 'scale-br')}
                />

                {/* Edge Lines */}
                <div className={`${styles.edge} ${styles.edgeTop}`} />
                <div className={`${styles.edge} ${styles.edgeRight}`} />
                <div className={`${styles.edge} ${styles.edgeBottom}`} />
                <div className={`${styles.edge} ${styles.edgeLeft}`} />
            </div>

            {/* Rotation Handle - positioned below the frame */}
            <div
                className={styles.rotateHandle}
                style={{
                    left: transformedX,
                    top: transformedY + (frameHeight / 2 * imageScale) + 24,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'rotate')}
            >
                <RotateCcw size={14} />
            </div>


        </div>
    );
};
