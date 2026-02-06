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
