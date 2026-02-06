import React, { useCallback, useRef, useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { EditorBlock, ImageLayer, getBlockImages } from '../types';
import styles from './PreviewTransformOverlay.module.css';

interface Props {
    block: EditorBlock | undefined;
    onUpdateImage: (imageId: string, updates: Partial<ImageLayer>) => void;
    onSelectImage: (imageId: string | undefined) => void;
    containerWidth: number;
    containerHeight: number;
}

type DragMode = 'move' | 'scale-tl' | 'scale-tr' | 'scale-bl' | 'scale-br' | 'rotate' | null;

// Video composition dimensions
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const VIDEO_ASPECT = VIDEO_WIDTH / VIDEO_HEIGHT;

export const PreviewTransformOverlay: React.FC<Props> = ({
    block,
    onUpdateImage,
    onSelectImage,
    containerWidth,
    containerHeight
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [dragMode, setDragMode] = useState<DragMode>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialValues, setInitialValues] = useState({
        x: 0, y: 0, scale: 1, rotation: 0
    });

    // Get images and selected image
    const images = block ? getBlockImages(block) : [];
    const selectedImageId = block?.selectedImageId;
    const selectedImage = images.find(img => img.id === selectedImageId);

    // Calculate video display area
    const containerAspect = containerWidth / containerHeight;
    let videoDisplayWidth: number;
    let videoDisplayHeight: number;

    if (containerAspect > VIDEO_ASPECT) {
        videoDisplayHeight = containerHeight;
        videoDisplayWidth = containerHeight * VIDEO_ASPECT;
    } else {
        videoDisplayWidth = containerWidth;
        videoDisplayHeight = containerWidth / VIDEO_ASPECT;
    }

    const scaleFactor = videoDisplayWidth / VIDEO_WIDTH;

    // Handle mouse down for transform
    const handleMouseDown = useCallback((e: React.MouseEvent, mode: DragMode) => {
        if (!selectedImage) return;
        e.preventDefault();
        e.stopPropagation();
        setDragMode(mode);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialValues({
            x: selectedImage.x,
            y: selectedImage.y,
            scale: selectedImage.scale,
            rotation: selectedImage.rotation
        });
    }, [selectedImage]);

    // Handle mouse move
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragMode || !selectedImageId) return;

        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        switch (dragMode) {
            case 'move': {
                const newX = initialValues.x + deltaX / scaleFactor;
                const newY = initialValues.y + deltaY / scaleFactor;
                onUpdateImage(selectedImageId, { x: newX, y: newY });
                break;
            }
            case 'scale-tl':
            case 'scale-tr':
            case 'scale-bl':
            case 'scale-br': {
                const isRight = dragMode.includes('r');
                const isBottom = dragMode.includes('b');
                const dirX = isRight ? 1 : -1;
                const dirY = isBottom ? 1 : -1;
                const distance = (deltaX * dirX + deltaY * dirY) / 2;
                const scaleChange = distance / 100;
                const newScale = Math.max(0.1, Math.min(5, initialValues.scale + scaleChange));
                onUpdateImage(selectedImageId, { scale: newScale });
                break;
            }
            case 'rotate': {
                const rotationChange = deltaX * 0.5;
                const newRotation = initialValues.rotation + rotationChange;
                onUpdateImage(selectedImageId, { rotation: newRotation });
                break;
            }
        }
    }, [dragMode, dragStart, initialValues, scaleFactor, selectedImageId, onUpdateImage]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        setDragMode(null);
    }, []);

    // Add global mouse listeners
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

    // Handle click on image to select
    const handleImageClick = useCallback((e: React.MouseEvent, imageId: string) => {
        e.preventDefault();
        e.stopPropagation();
        onSelectImage(imageId);
    }, [onSelectImage]);

    // Handle click on overlay background to deselect
    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onSelectImage(undefined);
        }
    }, [onSelectImage]);

    // Don't render if no block or no images
    if (!block || images.length === 0 || containerWidth === 0 || containerHeight === 0) {
        return null;
    }

    const frameWidth = videoDisplayWidth;
    const frameHeight = videoDisplayHeight;
    const frameCenterX = frameWidth / 2;
    const frameCenterY = frameHeight / 2;

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onClick={handleOverlayClick}
        >
            {/* Render clickable area for each image */}
            {images.map((image) => {
                const isSelected = image.id === selectedImageId;
                const transformedX = frameCenterX + (image.x * scaleFactor);
                const transformedY = frameCenterY + (image.y * scaleFactor);

                return (
                    <div
                        key={image.id}
                        className={`${styles.imageFrame} ${isSelected ? styles.imageFrameSelected : ''}`}
                        style={{
                            width: frameWidth,
                            height: frameHeight,
                            left: transformedX,
                            top: transformedY,
                            transform: `translate(-50%, -50%) rotate(${image.rotation}deg) scale(${image.scale})`,
                        }}
                        onClick={(e) => handleImageClick(e, image.id)}
                    >
                        {/* Show label */}
                        <div className={styles.imageLabel}>
                            画像 {images.indexOf(image) + 1}
                        </div>
                    </div>
                );
            })}

            {/* Transform controls for selected image */}
            {selectedImage && (
                <>
                    <div
                        className={styles.transformFrame}
                        style={{
                            width: frameWidth,
                            height: frameHeight,
                            left: frameCenterX + (selectedImage.x * scaleFactor),
                            top: frameCenterY + (selectedImage.y * scaleFactor),
                            transform: `translate(-50%, -50%) rotate(${selectedImage.rotation}deg) scale(${selectedImage.scale})`,
                        }}
                    >
                        {/* Move Area */}
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

                    {/* Rotation Handle */}
                    <div
                        className={styles.rotateHandle}
                        style={{
                            left: frameCenterX + (selectedImage.x * scaleFactor),
                            top: frameCenterY + (selectedImage.y * scaleFactor) + (frameHeight / 2 * selectedImage.scale) + 24,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'rotate')}
                    >
                        <RotateCcw size={14} />
                    </div>
                </>
            )}
        </div>
    );
};
