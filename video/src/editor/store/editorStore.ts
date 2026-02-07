import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { EditorBlock, ImageSpan } from '../types';
import { fetchScript, saveScript } from '../api';
import { saveImage, getImage, deleteImage, isBase64DataUrl, generateImageId } from './imageStorage';

// Custom storage with logging and error handling (singleton instance)
const loggingStorage: StateStorage = {
    getItem: (name: string): string | null => {
        try {
            const value = localStorage.getItem(name);
            console.log(`[Storage] getItem('${name}'): ${value ? `${value.length} chars` : 'null'}`);
            if (value) {
                try {
                    const parsed = JSON.parse(value);
                    const topKeys = Object.keys(parsed);
                    console.log(`[Storage] topLevelKeys:`, topKeys.join(', '));
                    console.log(`[Storage] hasState:`, !!parsed?.state);
                    console.log(`[Storage] version:`, parsed?.version);
                    if (parsed?.state) {
                        console.log(`[Storage] state keys:`, Object.keys(parsed.state).join(', '));
                    }
                    // Check if blocks exist and have images
                    if (parsed?.state?.blocks) {
                        console.log(`[Storage] Blocks count:`, parsed.state.blocks.length);
                        parsed.state.blocks.forEach((b: any, i: number) => {
                            if (b.images?.length || b.image) {
                                console.log(`[Storage] Block ${i} has images:`, {
                                    image: b.image?.substring(0, 50),
                                    images: b.images?.map((img: any) => ({ id: img.id, src: img.src?.substring(0, 50) }))
                                });
                            }
                        });
                    }
                } catch (parseErr) {
                    console.error(`[Storage] JSON parse error:`, parseErr);
                }
            }
            return value;
        } catch (e) {
            console.error(`[Storage] getItem error:`, e);
            return null;
        }
    },
    setItem: (name: string, value: string): void => {
        try {
            console.log(`[Storage] setItem('${name}'): ${value.length} chars`);
            localStorage.setItem(name, value);
            console.log(`[Storage] setItem success`);
        } catch (e) {
            console.error(`[Storage] setItem error (likely quota exceeded):`, e);
            // Try to show what we're trying to save (truncated)
            console.log(`[Storage] Failed value preview:`, value.substring(0, 500));
        }
    },
    removeItem: (name: string): void => {
        try {
            console.log(`[Storage] removeItem('${name}')`);
            localStorage.removeItem(name);
        } catch (e) {
            console.error(`[Storage] removeItem error:`, e);
        }
    },
};

// Map to store image references: blockId -> imageId (for IndexedDB lookup, legacy single image)
const imageRefMap = new Map<string, string>();
// Map for multi-image support: `${blockId}:${layerId}` -> indexedDbImageId
const imagesRefMap = new Map<string, string>();
// Runtime cache for loaded images: imageId -> dataUrl
const imageCache = new Map<string, string>();
// Track which saves have completed (to avoid referencing unsaved images)
const completedSaves = new Set<string>();

interface EditorState {
    blocks: EditorBlock[];
    imageSpans: ImageSpan[];
    isLoading: boolean;
    addBlock: (text?: string) => void;
    insertBlockAfter: (afterId: string, text?: string) => void;
    duplicateBlock: (id: string) => void;
    updateBlock: (id: string, partial: Partial<EditorBlock>) => void;
    removeBlock: (id: string) => void;
    removeSelected: () => void;
    reorderBlocks: (fromIndex: number, toIndex: number) => void;
    toggleSelection: (id: string) => void;
    selectAll: (select: boolean) => void;
    getSelectedCount: () => number;
    canMergeSelected: () => boolean;
    mergeSelected: () => void;
    addImageSpan: (sourceBlockId: string, imageLayerId: string, endBlockId: string) => void;
    updateImageSpan: (spanId: string, endBlockId: string) => void;
    removeImageSpan: (spanId: string) => void;
    removeSpansForImage: (blockId: string, imageLayerId: string) => void;
    loadScript: () => Promise<void>;
    saveOnly: () => Promise<void>;
    generateAllAudio: () => Promise<void>;
    generateAudioForBlock: (id: string) => Promise<void>;
    generateAudioForSelected: () => Promise<void>;
    loadImagesFromStorage: () => Promise<void>;
}

export const useEditorStore = create<EditorState>()(
    persist(
        temporal(
            (set, get) => ({
                blocks: [],
                imageSpans: [],
                isLoading: false,

                addBlock: (text = '') =>
                    set((state) => ({
                        blocks: [
                            ...state.blocks,
                            {
                                id: crypto.randomUUID(),
                                text,
                                speaker: 'metan', // Default speaker
                                durationInSeconds: 2.0,
                            },
                        ],
                    })),

                insertBlockAfter: (afterId, text = '') =>
                    set((state) => {
                        const index = state.blocks.findIndex(b => b.id === afterId);
                        if (index === -1) return state;

                        const newBlock: EditorBlock = {
                            id: crypto.randomUUID(),
                            text,
                            speaker: 'metan',
                            durationInSeconds: 2.0,
                        };

                        const newBlocks = [...state.blocks];
                        newBlocks.splice(index + 1, 0, newBlock);
                        return { blocks: newBlocks };
                    }),

                duplicateBlock: (id) =>
                    set((state) => {
                        const block = state.blocks.find(b => b.id === id);
                        if (!block) return state;

                        const index = state.blocks.findIndex(b => b.id === id);
                        const newBlock: EditorBlock = {
                            ...block,
                            id: crypto.randomUUID(),
                            isSelected: false,
                        };

                        const newBlocks = [...state.blocks];
                        newBlocks.splice(index + 1, 0, newBlock);
                        return { blocks: newBlocks };
                    }),

                updateBlock: (id, partial) => {
                    // Handle Base64 image: save to IndexedDB (legacy single image)
                    if (partial.image && isBase64DataUrl(partial.image)) {
                        const imageId = generateImageId();
                        const imageData = partial.image;

                        // Keep the image in memory for immediate display
                        imageRefMap.set(id, imageId);
                        imageCache.set(imageId, imageData);
                        // Mark as completed immediately - IndexedDB saves are reliable
                        completedSaves.add(id);

                        // Save to IndexedDB asynchronously
                        saveImage(imageId, imageData).catch(err => {
                            console.error('Failed to save image to IndexedDB:', err);
                            completedSaves.delete(id); // Rollback on failure
                        });
                    }

                    // Handle Base64 images in the images array (multi-image support)
                    if (partial.images && Array.isArray(partial.images)) {
                        partial.images.forEach((layer) => {
                            if (layer.src && isBase64DataUrl(layer.src)) {
                                const refKey = `${id}:${layer.id}`;
                                // Check if already saved
                                if (!imagesRefMap.has(refKey)) {
                                    const indexedDbImageId = generateImageId();
                                    const imageData = layer.src;

                                    // Keep in memory for immediate display
                                    imagesRefMap.set(refKey, indexedDbImageId);
                                    imageCache.set(indexedDbImageId, imageData);
                                    // Mark as completed immediately - IndexedDB saves are reliable
                                    completedSaves.add(refKey);

                                    // Save to IndexedDB asynchronously
                                    saveImage(indexedDbImageId, imageData).catch(err => {
                                        console.error('Failed to save multi-image to IndexedDB:', err);
                                        completedSaves.delete(refKey); // Rollback on failure
                                    });
                                }
                            }
                        });
                    }

                    set((state) => ({
                        blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...partial } : b)),
                    }));
                },

                removeBlock: (id) =>
                    set((state) => {
                        const newBlocks = state.blocks.filter((b) => b.id !== id);
                        const newSpans = state.imageSpans
                            .filter(span => span.sourceBlockId !== id)
                            .map(span => {
                                if (span.endBlockId === id) {
                                    // Shrink span: find the block just before the deleted one
                                    const oldIndex = state.blocks.findIndex(b => b.id === id);
                                    const sourceIndex = state.blocks.findIndex(b => b.id === span.sourceBlockId);
                                    if (oldIndex <= sourceIndex + 1) return null; // Would collapse
                                    const prevBlock = state.blocks[oldIndex - 1];
                                    if (prevBlock && prevBlock.id !== span.sourceBlockId) {
                                        return { ...span, endBlockId: prevBlock.id };
                                    }
                                    return null;
                                }
                                return span;
                            })
                            .filter((s): s is ImageSpan => s !== null);
                        return { blocks: newBlocks, imageSpans: newSpans };
                    }),

                removeSelected: () =>
                    set((state) => {
                        const removedIds = new Set(state.blocks.filter(b => b.isSelected).map(b => b.id));
                        const newBlocks = state.blocks.filter((b) => !b.isSelected);
                        const newSpans = state.imageSpans.filter(span =>
                            !removedIds.has(span.sourceBlockId) && !removedIds.has(span.endBlockId)
                        );
                        return { blocks: newBlocks, imageSpans: newSpans };
                    }),

                reorderBlocks: (fromIndex, toIndex) =>
                    set((state) => {
                        const newBlocks = [...state.blocks];
                        const [moved] = newBlocks.splice(fromIndex, 1);
                        newBlocks.splice(toIndex, 0, moved);
                        // Validate spans after reorder
                        const validSpans = state.imageSpans.filter(span => {
                            const sIdx = newBlocks.findIndex(b => b.id === span.sourceBlockId);
                            const eIdx = newBlocks.findIndex(b => b.id === span.endBlockId);
                            return sIdx !== -1 && eIdx !== -1 && eIdx > sIdx;
                        });
                        return { blocks: newBlocks, imageSpans: validSpans };
                    }),

                toggleSelection: (id) =>
                    set((state) => ({
                        blocks: state.blocks.map((b) =>
                            b.id === id ? { ...b, isSelected: !b.isSelected } : b
                        ),
                    })),

                selectAll: (select) =>
                    set((state) => ({
                        blocks: state.blocks.map((b) => ({ ...b, isSelected: select })),
                    })),

                getSelectedCount: () => {
                    return get().blocks.filter(b => b.isSelected).length;
                },

                canMergeSelected: () => {
                    const { blocks } = get();
                    const selectedIndices = blocks
                        .map((b, i) => b.isSelected ? i : -1)
                        .filter(i => i !== -1);

                    // Need at least 2 selected
                    if (selectedIndices.length < 2) return false;

                    // Check if all selected are adjacent (consecutive indices)
                    for (let i = 1; i < selectedIndices.length; i++) {
                        if (selectedIndices[i] !== selectedIndices[i - 1] + 1) {
                            return false;
                        }
                    }
                    return true;
                },

                mergeSelected: () => {
                    const { blocks } = get();
                    const selectedIndices = blocks
                        .map((b, i) => b.isSelected ? i : -1)
                        .filter(i => i !== -1);

                    // Validate adjacency
                    if (selectedIndices.length < 2) return;
                    for (let i = 1; i < selectedIndices.length; i++) {
                        if (selectedIndices[i] !== selectedIndices[i - 1] + 1) {
                            return;
                        }
                    }

                    // Get selected blocks in order
                    const selectedBlocks = selectedIndices.map(i => blocks[i]);

                    // Merge into the first block
                    const firstBlock = selectedBlocks[0];
                    const mergedText = selectedBlocks.map(b => b.text).join('');
                    const mergedDuration = selectedBlocks.reduce((acc, b) => acc + b.durationInSeconds, 0);

                    // Use the first block's speaker and image
                    const mergedBlock: EditorBlock = {
                        ...firstBlock,
                        text: mergedText,
                        durationInSeconds: mergedDuration,
                        audio: undefined, // Clear audio - needs regeneration
                        isSelected: false,
                    };

                    // Create new blocks array
                    const newBlocks = blocks.filter((_, i) => !selectedIndices.includes(i));
                    newBlocks.splice(selectedIndices[0], 0, mergedBlock);

                    // Clean up spans touching merged blocks
                    const mergedIds = new Set(selectedBlocks.map(b => b.id));
                    const { imageSpans } = get();
                    const cleanSpans = imageSpans.filter(span =>
                        !mergedIds.has(span.sourceBlockId) && !mergedIds.has(span.endBlockId)
                    );

                    set({ blocks: newBlocks, imageSpans: cleanSpans });
                },

                addImageSpan: (sourceBlockId, imageLayerId, endBlockId) =>
                    set((state) => ({
                        imageSpans: [
                            ...state.imageSpans,
                            { id: crypto.randomUUID(), sourceBlockId, imageLayerId, endBlockId },
                        ],
                    })),

                updateImageSpan: (spanId, endBlockId) =>
                    set((state) => ({
                        imageSpans: state.imageSpans.map(span =>
                            span.id === spanId ? { ...span, endBlockId } : span
                        ),
                    })),

                removeImageSpan: (spanId) =>
                    set((state) => ({
                        imageSpans: state.imageSpans.filter(span => span.id !== spanId),
                    })),

                removeSpansForImage: (blockId, imageLayerId) =>
                    set((state) => ({
                        imageSpans: state.imageSpans.filter(span =>
                            !(span.sourceBlockId === blockId && span.imageLayerId === imageLayerId)
                        ),
                    })),

                loadScript: async () => {
                    set({ isLoading: true });
                    try {
                        const blocks = await fetchScript();
                        if (blocks.length > 0) {
                            set({ blocks, imageSpans: [] });
                        } else {
                            if (get().blocks.length === 0) {
                                get().addBlock("こんにちは、VisionForgeSへようこそ！");
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    } finally {
                        set({ isLoading: false });
                    }
                },

                saveOnly: async () => {
                    set({ isLoading: true });
                    try {
                        const { blocks } = get();
                        await saveScript(blocks, false);
                    } catch (e) {
                        console.error(e);
                        alert("保存に失敗しました。");
                    } finally {
                        set({ isLoading: false });
                    }
                },

                generateAllAudio: async () => {
                    set({ isLoading: true });
                    try {
                        const { blocks } = get();
                        await saveScript(blocks, true);
                        const updatedBlocks = await fetchScript();
                        set({ blocks: updatedBlocks });
                    } catch (e) {
                        console.error(e);
                        alert("音声生成に失敗しました。");
                    } finally {
                        set({ isLoading: false });
                    }
                },

                generateAudioForBlock: async (id: string) => {
                    set({ isLoading: true });
                    try {
                        const { blocks } = get();
                        // Clear audio for the target block to force regeneration
                        const blocksToSave = blocks.map(b =>
                            b.id === id ? { ...b, audio: undefined } : b
                        );
                        await saveScript(blocksToSave, true);
                        const updatedBlocks = await fetchScript();
                        set({ blocks: updatedBlocks });
                    } catch (e) {
                        console.error(e);
                        alert("音声生成に失敗しました。");
                    } finally {
                        set({ isLoading: false });
                    }
                },

                generateAudioForSelected: async () => {
                    set({ isLoading: true });
                    try {
                        const { blocks } = get();
                        // Clear audio for selected blocks to force regeneration
                        const blocksToSave = blocks.map(b =>
                            b.isSelected ? { ...b, audio: undefined } : b
                        );
                        await saveScript(blocksToSave, true);
                        const updatedBlocks = await fetchScript();
                        set({ blocks: updatedBlocks });
                    } catch (e) {
                        console.error(e);
                        alert("音声生成に失敗しました。");
                    } finally {
                        set({ isLoading: false });
                    }
                },

                loadImagesFromStorage: async () => {
                    console.log('[ImageStore] loadImagesFromStorage called');
                    const { blocks } = get();
                    console.log('[ImageStore] Current blocks:', blocks.map(b => ({
                        id: b.id,
                        image: b.image?.substring(0, 50),
                        images: b.images?.map(img => ({ id: img.id, src: img.src?.substring(0, 50) }))
                    })));
                    console.log('[ImageStore] imagesRefMap:', Array.from(imagesRefMap.entries()));
                    console.log('[ImageStore] completedSaves:', Array.from(completedSaves));
                    const updatedBlocks = await Promise.all(
                        blocks.map(async (block) => {
                            let updatedBlock = { ...block };

                            // Handle legacy single image: Check if image is an IndexedDB reference
                            if (block.image && block.image.startsWith('indexeddb:')) {
                                const imageId = block.image.replace('indexeddb:', '');
                                // Try cache first
                                let imageData = imageCache.get(imageId);
                                if (!imageData) {
                                    // Load from IndexedDB
                                    imageData = await getImage(imageId) || undefined;
                                    if (imageData) {
                                        imageCache.set(imageId, imageData);
                                        imageRefMap.set(block.id, imageId);
                                        completedSaves.add(block.id); // Mark as completed
                                    }
                                }
                                updatedBlock.image = imageData || undefined;
                            } else {
                                // Check if this block has an image reference in the map
                                const imageId = imageRefMap.get(block.id);
                                if (imageId && !block.image) {
                                    // Try cache first
                                    let imageData = imageCache.get(imageId);
                                    if (!imageData) {
                                        // Load from IndexedDB
                                        imageData = await getImage(imageId) || undefined;
                                        if (imageData) {
                                            imageCache.set(imageId, imageData);
                                            completedSaves.add(block.id); // Mark as completed
                                        }
                                    }
                                    if (imageData) {
                                        updatedBlock.image = imageData;
                                    }
                                }
                            }

                            // Handle images array: Load each image from IndexedDB if needed
                            if (block.images && Array.isArray(block.images)) {
                                updatedBlock.images = await Promise.all(
                                    block.images.map(async (layer) => {
                                        if (layer.src && layer.src.startsWith('indexeddb:')) {
                                            const indexedDbImageId = layer.src.replace('indexeddb:', '');
                                            const refKey = `${block.id}:${layer.id}`;
                                            // Try cache first
                                            let imageData = imageCache.get(indexedDbImageId);
                                            if (!imageData) {
                                                // Load from IndexedDB
                                                imageData = await getImage(indexedDbImageId) || undefined;
                                                if (imageData) {
                                                    imageCache.set(indexedDbImageId, imageData);
                                                    imagesRefMap.set(refKey, indexedDbImageId);
                                                    completedSaves.add(refKey); // Mark as completed
                                                }
                                            }
                                            return {
                                                ...layer,
                                                src: imageData || '',
                                            };
                                        }
                                        return layer;
                                    })
                                );
                            }

                            return updatedBlock;
                        })
                    );
                    set({ blocks: updatedBlocks });
                }
            }),
            {
                partialize: (state) => ({ blocks: state.blocks, imageSpans: state.imageSpans }),
                limit: 50
            }
        ),
        {
            name: 'vision-forge-storage',
            storage: createJSONStorage(() => loggingStorage),
            // Exclude Base64 images from localStorage to avoid quota issues
            partialize: (state) => {
                const result = {
                    blocks: state.blocks.map(block => {
                        let updatedBlock = { ...block };

                        // Handle legacy single image: If Base64 and save completed, use reference
                        if (block.image && isBase64DataUrl(block.image)) {
                            const imageId = imageRefMap.get(block.id);
                            // Only use IndexedDB reference if save has completed
                            if (imageId && completedSaves.has(block.id)) {
                                updatedBlock.image = `indexeddb:${imageId}`;
                            } else {
                                // Save not completed yet - keep Base64 in localStorage as fallback
                                // This may cause quota issues for very large images, but ensures data isn't lost
                                updatedBlock.image = block.image;
                            }
                        }

                        // Handle images array: Replace Base64 with IndexedDB references only if save completed
                        if (block.images && Array.isArray(block.images)) {
                            updatedBlock.images = block.images.map(layer => {
                                if (layer.src && isBase64DataUrl(layer.src)) {
                                    const refKey = `${block.id}:${layer.id}`;
                                    const indexedDbImageId = imagesRefMap.get(refKey);
                                    // Only use IndexedDB reference if save has completed
                                    if (indexedDbImageId && completedSaves.has(refKey)) {
                                        console.log('[ImageStore] partialize: Converting to indexeddb ref:', refKey, indexedDbImageId);
                                        return {
                                            ...layer,
                                            src: `indexeddb:${indexedDbImageId}`,
                                        };
                                    }
                                    // Save not completed - keep Base64 data
                                    console.log('[ImageStore] partialize: Keeping Base64 for:', refKey);
                                    return layer;
                                }
                                return layer;
                            });
                        }

                        return updatedBlock;
                    }),
                    imageSpans: state.imageSpans,
                    // Also save image reference maps (only for completed saves)
                    imageRefs: Array.from(imageRefMap.entries()).filter(([blockId]) => completedSaves.has(blockId)),
                    imagesRefs: Array.from(imagesRefMap.entries()).filter(([refKey]) => completedSaves.has(refKey)),
                };
                console.log('[ImageStore] partialize result:', {
                    blocksWithImages: result.blocks.filter(b => b.images?.length).map(b => ({
                        id: b.id,
                        images: b.images?.map(img => ({ id: img.id, src: img.src?.substring(0, 50) }))
                    })),
                    imageRefs: result.imageRefs,
                    imagesRefs: result.imagesRefs,
                });
                return result;
            },
            onRehydrateStorage: () => (state) => {
                console.log('[ImageStore] onRehydrateStorage called');

                // Direct check of localStorage
                const rawData = localStorage.getItem('vision-forge-storage');
                if (rawData) {
                    try {
                        const parsed = JSON.parse(rawData);
                        console.log('[ImageStore] Raw localStorage parsed:', {
                            hasState: !!parsed?.state,
                            stateBlocksCount: parsed?.state?.blocks?.length,
                            imageRefs: parsed?.state?.imageRefs,
                            imagesRefs: parsed?.state?.imagesRefs,
                        });
                    } catch (e) {
                        console.error('[ImageStore] Raw localStorage parse error:', e);
                    }
                }

                console.log('[ImageStore] Persisted state from zustand:', state ? {
                    blocksCount: state.blocks?.length,
                    imageRefs: (state as any).imageRefs,
                    imagesRefs: (state as any).imagesRefs,
                } : 'null');

                // Restore image reference map from persisted state (legacy single image)
                if (state && (state as any).imageRefs) {
                    const refs = (state as any).imageRefs as [string, string][];
                    console.log('[ImageStore] Restoring imageRefs:', refs);
                    refs.forEach(([blockId, imageId]) => {
                        imageRefMap.set(blockId, imageId);
                        completedSaves.add(blockId); // Mark as completed since it was persisted
                    });
                }

                // Restore images reference map from persisted state (multi-image)
                if (state && (state as any).imagesRefs) {
                    const refs = (state as any).imagesRefs as [string, string][];
                    console.log('[ImageStore] Restoring imagesRefs:', refs);
                    refs.forEach(([refKey, imageId]) => {
                        imagesRefMap.set(refKey, imageId);
                        completedSaves.add(refKey); // Mark as completed since it was persisted
                    });
                }

                // Load images from IndexedDB
                if (state) {
                    state.loadImagesFromStorage();
                }
            },
        }
    )
);
