import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EditorBlock } from '../types';
import { fetchScript, saveScript } from '../api';

interface EditorState {
    blocks: EditorBlock[];
    isLoading: boolean;
    addBlock: (text?: string) => void;
    updateBlock: (id: string, partial: Partial<EditorBlock>) => void;
    removeBlock: (id: string) => void;
    reorderBlocks: (fromIndex: number, toIndex: number) => void;
    toggleSelection: (id: string) => void;
    selectAll: (select: boolean) => void;
    loadScript: () => Promise<void>;
    saveAndGenerate: () => Promise<void>;
}

export const useEditorStore = create<EditorState>()(
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
                            speaker: 'kanon', // Default to Kanon as per backend default
                            durationInSeconds: 2.0,
                        },
                    ],
                })),

            updateBlock: (id, partial) =>
                set((state) => ({
                    blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...partial } : b)),
                })),

            removeBlock: (id) =>
                set((state) => ({
                    blocks: state.blocks.filter((b) => b.id !== id),
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

            loadScript: async () => {
                set({ isLoading: true });
                try {
                    const blocks = await fetchScript();
                    if (blocks.length > 0) {
                        set({ blocks });
                    } else {
                        // Only add default if absolutely empty and pulling from server returns nothing
                        if (get().blocks.length === 0) {
                            get().addBlock("こんにちは、VisionForgeSへようこそ！");
                        }
                    }
                } catch (e) {
                    console.error(e);
                    // Do not overwrite local blocks on error
                } finally {
                    set({ isLoading: false });
                }
            },

            saveAndGenerate: async () => {
                set({ isLoading: true });
                try {
                    const { blocks } = get();
                    await saveScript(blocks);
                    // Reload to get updated durations and audio paths
                    const updatedBlocks = await fetchScript();
                    set({ blocks: updatedBlocks });
                } catch (e) {
                    console.error(e);
                    alert("保存・音声生成に失敗しました。バックエンドを確認してください。");
                } finally {
                    set({ isLoading: false });
                }
            }
        }),
        {
            name: 'vision-forge-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            partialize: (state) => ({ blocks: state.blocks }), // Only persist blocks, not isLoading
        }
    )
);
