// Individual image layer with its own transform
export interface ImageLayer {
    id: string;
    src: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
}

export const MAX_IMAGES_PER_BLOCK = 2;

export interface EditorBlock {
    id: string;
    text: string;
    speaker: string;
    durationInSeconds: number;
    // Legacy single image support (for backward compatibility)
    image?: string;
    imageX?: number;
    imageY?: number;
    imageScale?: number;
    imageRotation?: number;
    // Multiple images support
    images?: ImageLayer[];
    selectedImageId?: string; // Currently selected image for editing
    audio?: string;
    isSelected?: boolean;
    // Word tokens for display (generated from text)
    tokens?: string[];
}

// Helper to get all images from a block (handles both legacy and new format)
export const getBlockImages = (block: EditorBlock): ImageLayer[] => {
    // If images array exists, use it
    if (block.images && block.images.length > 0) {
        return block.images;
    }
    // Legacy: convert single image to array format
    if (block.image) {
        return [{
            id: 'legacy-image',
            src: block.image,
            x: block.imageX || 0,
            y: block.imageY || 0,
            scale: block.imageScale || 1,
            rotation: block.imageRotation || 0,
        }];
    }
    return [];
};

// Image span: an image that visually extends across multiple blocks
export interface ImageSpan {
    id: string;
    sourceBlockId: string;   // Block that owns the original image
    imageLayerId: string;    // Which ImageLayer in that block
    endBlockId: string;      // Last block the span covers (inclusive)
}

// Get all images visible on a given block, including spanned images from other blocks
export const getEffectiveImages = (
    blocks: EditorBlock[],
    imageSpans: ImageSpan[],
    blockId: string
): ImageLayer[] => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return [];

    const ownImages = getBlockImages(block);
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    const spannedImages: ImageLayer[] = [];

    for (const span of imageSpans) {
        const sourceIndex = blocks.findIndex(b => b.id === span.sourceBlockId);
        const endIndex = blocks.findIndex(b => b.id === span.endBlockId);
        if (sourceIndex === -1 || endIndex === -1) continue;

        // Block is within span range (source block uses own images, so exclude it)
        if (blockIndex > sourceIndex && blockIndex <= endIndex) {
            const sourceBlock = blocks[sourceIndex];
            const sourceImages = getBlockImages(sourceBlock);
            const spannedLayer = sourceImages.find(img => img.id === span.imageLayerId);
            if (spannedLayer) {
                spannedImages.push(spannedLayer);
            }
        }
    }

    return [...spannedImages, ...ownImages];
};

export interface VideoConfig {
    fps: number;
    width: number;
    height: number;
}

export interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    playbackRate: number;
}

export interface Clip {
    id: string;
    name: string;
    blockIds: string[];
    thumbnail?: string;
}

// Speaker configuration
export interface SpeakerConfig {
    id: string;
    name: string;
    displayName: string;
    color: string;
    icon?: string;
}

export const SPEAKERS: SpeakerConfig[] = [
    { id: 'kanon', name: 'kanon', displayName: '雨晴はう', color: '#4FC3F7' },
    { id: 'zundamon', name: 'zundamon', displayName: 'ずんだもん', color: '#81C784' },
    { id: 'metan', name: 'metan', displayName: '四国めたん', color: '#FF8A65' },
    { id: 'tsumugi', name: 'tsumugi', displayName: '春日部つむぎ', color: '#BA68C8' },
];

export const getSpeakerConfig = (speakerId: string): SpeakerConfig => {
    return SPEAKERS.find(s => s.id === speakerId) || SPEAKERS[0];
};
