export interface EditorBlock {
    id: string;
    text: string;
    speaker: string;
    durationInSeconds: number;
    image?: string;
    imageX?: number;
    imageY?: number;
    imageScale?: number;
    imageRotation?: number;
    audio?: string;
    isSelected?: boolean;
    // Word tokens for display (generated from text)
    tokens?: string[];
}

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
