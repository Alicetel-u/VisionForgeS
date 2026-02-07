import React, { useCallback, useState, useEffect, useRef } from 'react';
import { EditorBlock, ImageSpan, getBlockImages } from '../types';
import { useEditorStore } from '../store/editorStore';
import styles from './ImageSpanOverlay.module.css';

interface Props {
    blocks: EditorBlock[];
    imageSpans: ImageSpan[];
    blockListRef: React.RefObject<HTMLDivElement>;
}

interface BlockPosition {
    top: number;
    height: number;
    centerY: number;
}

interface DragState {
    type: 'create' | 'resize';
    sourceBlockId: string;
    imageLayerId: string;
    spanId?: string; // only for resize
    currentEndBlockId: string;
}

export const ImageSpanOverlay: React.FC<Props> = ({ blocks, imageSpans, blockListRef }) => {
    const { addImageSpan, updateImageSpan, removeImageSpan } = useEditorStore();
    const [blockPositions, setBlockPositions] = useState<Map<string, BlockPosition>>(new Map());
    const [dragState, setDragState] = useState<DragState | null>(null);
    const dragRef = useRef<DragState | null>(null);

    // Compute block positions from DOM
    const updateBlockPositions = useCallback(() => {
        if (!blockListRef.current) return;
        const container = blockListRef.current;
        const containerRect = container.getBoundingClientRect();
        const positions = new Map<string, BlockPosition>();

        const blockElements = container.querySelectorAll('[data-block-id]');
        blockElements.forEach(el => {
            const blockId = el.getAttribute('data-block-id');
            if (blockId) {
                const rect = el.getBoundingClientRect();
                const top = rect.top - containerRect.top + container.scrollTop;
                positions.set(blockId, {
                    top,
                    height: rect.height,
                    centerY: top + rect.height / 2,
                });
            }
        });
        setBlockPositions(positions);
    }, [blockListRef]);

    // Update positions on blocks change, scroll, resize
    useEffect(() => {
        updateBlockPositions();
        const container = blockListRef.current;
        if (!container) return;

        const observer = new ResizeObserver(updateBlockPositions);
        observer.observe(container);
        // Observe individual block elements too
        const blockElements = container.querySelectorAll('[data-block-id]');
        blockElements.forEach(el => observer.observe(el));

        container.addEventListener('scroll', updateBlockPositions);

        return () => {
            observer.disconnect();
            container.removeEventListener('scroll', updateBlockPositions);
        };
    }, [blocks, updateBlockPositions, blockListRef]);

    // Find which block is at a given Y coordinate
    const getBlockAtY = useCallback((y: number): string | null => {
        for (const [blockId, pos] of blockPositions) {
            if (y >= pos.top && y < pos.top + pos.height) {
                return blockId;
            }
        }
        return null;
    }, [blockPositions]);

    // Start drag to create a new span
    const handleIndicatorMouseDown = useCallback((e: React.MouseEvent, blockId: string, imageLayerId: string) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if a span already exists for this image
        const existing = imageSpans.find(
            s => s.sourceBlockId === blockId && s.imageLayerId === imageLayerId
        );
        if (existing) return; // Already has a span, use the drag handle instead

        const state: DragState = {
            type: 'create',
            sourceBlockId: blockId,
            imageLayerId,
            currentEndBlockId: blockId,
        };
        setDragState(state);
        dragRef.current = state;
    }, [imageSpans]);

    // Start drag to resize an existing span
    const handleDragHandleMouseDown = useCallback((e: React.MouseEvent, span: ImageSpan) => {
        e.preventDefault();
        e.stopPropagation();

        const state: DragState = {
            type: 'resize',
            sourceBlockId: span.sourceBlockId,
            imageLayerId: span.imageLayerId,
            spanId: span.id,
            currentEndBlockId: span.endBlockId,
        };
        setDragState(state);
        dragRef.current = state;
    }, []);

    // Global mouse move during drag
    useEffect(() => {
        if (!dragState) return;

        const handleMouseMove = (e: MouseEvent) => {
            const current = dragRef.current;
            if (!current || !blockListRef.current) return;

            const containerRect = blockListRef.current.getBoundingClientRect();
            const y = e.clientY - containerRect.top + blockListRef.current.scrollTop;
            const targetBlockId = getBlockAtY(y);

            if (targetBlockId) {
                const sourceIndex = blocks.findIndex(b => b.id === current.sourceBlockId);
                const targetIndex = blocks.findIndex(b => b.id === targetBlockId);

                // Only allow extending downward (target must be after source)
                if (targetIndex > sourceIndex && targetBlockId !== current.currentEndBlockId) {
                    const newState = { ...current, currentEndBlockId: targetBlockId };
                    setDragState(newState);
                    dragRef.current = newState;
                }
                // Allow shrinking back to source (which means removing span)
                if (targetIndex <= sourceIndex && current.currentEndBlockId !== current.sourceBlockId) {
                    const newState = { ...current, currentEndBlockId: current.sourceBlockId };
                    setDragState(newState);
                    dragRef.current = newState;
                }
            }
        };

        const handleMouseUp = () => {
            const current = dragRef.current;
            if (!current) return;

            if (current.currentEndBlockId !== current.sourceBlockId) {
                if (current.type === 'create') {
                    addImageSpan(current.sourceBlockId, current.imageLayerId, current.currentEndBlockId);
                } else if (current.type === 'resize' && current.spanId) {
                    updateImageSpan(current.spanId, current.currentEndBlockId);
                }
            } else if (current.type === 'resize' && current.spanId) {
                // Shrunk back to source -> remove span
                removeImageSpan(current.spanId);
            }

            setDragState(null);
            dragRef.current = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [dragState, blocks, getBlockAtY, addImageSpan, updateImageSpan, removeImageSpan, blockListRef]);

    // Double-click span bar to remove
    const handleSpanDoubleClick = useCallback((spanId: string) => {
        removeImageSpan(spanId);
    }, [removeImageSpan]);

    // Render
    if (blockPositions.size === 0) return null;

    // Collect indicators: only for the selected image in each block (or the only image if just one)
    const indicators: { blockId: string; imageLayerId: string; centerY: number }[] = [];
    blocks.forEach(block => {
        const images = getBlockImages(block);
        if (images.length === 0) return;

        // Determine which image to show indicator for
        const targetImage = images.length === 1
            ? images[0]
            : images.find(img => img.id === block.selectedImageId) || null;

        if (targetImage) {
            const hasSpan = imageSpans.some(
                s => s.sourceBlockId === block.id && s.imageLayerId === targetImage.id
            );
            if (!hasSpan) {
                const pos = blockPositions.get(block.id);
                if (pos) {
                    indicators.push({
                        blockId: block.id,
                        imageLayerId: targetImage.id,
                        centerY: pos.centerY,
                    });
                }
            }
        }
    });

    // Compute span bar positions
    const spanBars: {
        span: ImageSpan;
        top: number;
        height: number;
        handleY: number;
    }[] = [];

    imageSpans.forEach(span => {
        // Only show span bar if the source block's selected image matches (or block has only 1 image)
        const sourceBlock = blocks.find(b => b.id === span.sourceBlockId);
        if (sourceBlock) {
            const images = getBlockImages(sourceBlock);
            if (images.length > 1 && sourceBlock.selectedImageId && sourceBlock.selectedImageId !== span.imageLayerId) {
                return; // Different image selected, hide this span bar
            }
        }

        const sourcePos = blockPositions.get(span.sourceBlockId);
        const endPos = blockPositions.get(span.endBlockId);
        if (sourcePos && endPos) {
            const top = sourcePos.centerY;
            const bottom = endPos.centerY;
            spanBars.push({
                span,
                top,
                height: Math.max(bottom - top, 4),
                handleY: bottom,
            });
        }
    });

    // Compute drag preview bar
    let previewBar: { top: number; height: number } | null = null;
    if (dragState && dragState.currentEndBlockId !== dragState.sourceBlockId) {
        const sourcePos = blockPositions.get(dragState.sourceBlockId);
        const endPos = blockPositions.get(dragState.currentEndBlockId);
        if (sourcePos && endPos) {
            const top = sourcePos.centerY;
            const bottom = endPos.centerY;
            previewBar = { top, height: Math.max(bottom - top, 4) };
        }
    }

    return (
        <div className={styles.spanColumn}>
            {/* Indicators for images without spans */}
            {indicators.map((ind, i) => (
                <div
                    key={`ind-${ind.blockId}-${ind.imageLayerId}`}
                    className={styles.imageIndicator}
                    style={{ top: ind.centerY - 5 }}
                    onMouseDown={(e) => handleIndicatorMouseDown(e, ind.blockId, ind.imageLayerId)}
                    title="下にドラッグして画像の表示範囲を拡張"
                />
            ))}

            {/* Existing span bars */}
            {spanBars.map(({ span, top, height, handleY }) => (
                <React.Fragment key={span.id}>
                    {/* Source dot */}
                    <div
                        className={styles.imageIndicator}
                        style={{ top: top - 5, cursor: 'default' }}
                    />
                    {/* Bar */}
                    <div
                        className={styles.spanBar}
                        style={{ top, height }}
                        onDoubleClick={() => handleSpanDoubleClick(span.id)}
                        title="ダブルクリックで範囲を解除"
                    />
                    {/* Bottom drag handle */}
                    <div
                        className={styles.dragHandle}
                        style={{ top: handleY }}
                        onMouseDown={(e) => handleDragHandleMouseDown(e, span)}
                        title="ドラッグして範囲を調整"
                    />
                </React.Fragment>
            ))}

            {/* Drag preview */}
            {previewBar && (
                <div
                    className={styles.previewBar}
                    style={{ top: previewBar.top, height: previewBar.height }}
                />
            )}
        </div>
    );
};
