import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { EditorBlock } from '../types';
import { fetchScript, saveScript } from '../api';
import { saveImage, getImage, deleteImage, isBase64DataUrl, generateImageId } from './imageStorage';

// Map to store image references: blockId -> imageId (for IndexedDB lookup)
const imageRefMap = new Map<string, string>();
// Runtime cache for loaded images: imageId -> dataUrl
const imageCache = new Map<string, string>();

interface EditorState {
    blocks: EditorBlock[];
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
    loadScript: () => Promise<void>;
    saveOnly: () => Promise<void>;
    generateAllAudio: () => Promise<void>;
    generateAudioForBlock: (id: string) => Promise<void>;
    generateAudioForSelected: () => Promise<void>;
    loadImagesFromStorage: () => Promise<void>;
}

export const useEditorStore = create<EditorState>()(
    temporal(
        persist(
            (set, get) => ({
                blocks: [],
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
                    // Handle Base64 image: save to IndexedDB
                    if (partial.image && isBase64DataUrl(partial.image)) {
                        const imageId = generateImageId();
                        const imageData = partial.image;

                        // Save to IndexedDB asynchronously
                        saveImage(imageId, imageData).then(() => {
                            imageRefMap.set(id, imageId);
                            imageCache.set(imageId, imageData);
                        }).catch(err => console.error('Failed to save image to IndexedDB:', err));

                        // Keep the image in memory for immediate display
                        // but store only the reference for persistence
                        imageRefMap.set(id, imageId);
                        imageCache.set(imageId, imageData);
                    }

                    set((state) => ({
                        blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...partial } : b)),
                    }));
                },

                removeBlock: (id) =>
                    set((state) => ({
                        blocks: state.blocks.filter((b) => b.id !== id),
                    })),

                removeSelected: () =>
                    set((state) => ({
                        blocks: state.blocks.filter((b) => !b.isSelected),
                    })),

                reorderBlocks: (fromIndex, toIndex) =>
                    set((state) => {
                        const newBlocks = [...state.blocks];
                        const [moved] = newBlocks.splice(fromIndex, 1);
                        newBlocks.splice(toIndex, 0, moved);
                        return { blocks: newBlocks };
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

                    set({ blocks: newBlocks });
                },

                loadScript: async () => {
                    set({ isLoading: true });
                    try {
                        const blocks = await fetchScript();
                        if (blocks.length > 0) {
                            set({ blocks });
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
                    const { blocks } = get();
                    const updatedBlocks = await Promise.all(
                        blocks.map(async (block) => {
                            // Check if image is an IndexedDB reference
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
                                    }
                                }
                                if (imageData) {
                                    return { ...block, image: imageData };
                                }
                                // Image not found in IndexedDB, clear the reference
                                return { ...block, image: undefined };
                            }
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
                                    }
                                }
                                if (imageData) {
                                    return { ...block, image: imageData };
                                }
                            }
                            return block;
                        })
                    );
                    set({ blocks: updatedBlocks });
                }
            }),
            {
                name: 'vision-forge-storage',
                storage: createJSONStorage(() => localStorage),
                // Exclude Base64 images from localStorage to avoid quota issues
                partialize: (state) => ({
                    blocks: state.blocks.map(block => {
                        // If image is Base64, save reference instead
                        if (block.image && isBase64DataUrl(block.image)) {
                            const imageId = imageRefMap.get(block.id);
                            return {
                                ...block,
                                image: imageId ? `indexeddb:${imageId}` : undefined,
                            };
                        }
                        return block;
                    }),
                    // Also save image reference map
                    imageRefs: Array.from(imageRefMap.entries()),
                }),
                onRehydrateStorage: () => (state) => {
                    // Restore image reference map from persisted state
                    if (state && (state as any).imageRefs) {
                        const refs = (state as any).imageRefs as [string, string][];
                        refs.forEach(([blockId, imageId]) => {
                            imageRefMap.set(blockId, imageId);
                        });
                    }

                    // Load images from IndexedDB
                    if (state) {
                        state.loadImagesFromStorage();
                    }
                },
            }
        ),
        {
            partialize: (state) => ({ blocks: state.blocks }),
            limit: 50
        }
    )
);
