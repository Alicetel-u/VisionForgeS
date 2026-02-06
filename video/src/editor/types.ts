export interface EditorBlock {
    id: string;
    text: string;
    speaker: string;
    durationInSeconds: number;
    image?: string;
    audio?: string;
    isSelected?: boolean;
}

export interface VideoConfig {
    fps: number;
    width: number;
    height: number;
}
