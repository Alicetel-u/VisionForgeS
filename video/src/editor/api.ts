import { EditorBlock, ImageSpan } from './types';

const API_BASE = 'http://localhost:8000/api';

export const fetchScript = async (): Promise<EditorBlock[]> => {
    const response = await fetch(`${API_BASE}/script`);
    if (!response.ok) {
        throw new Error('Failed to fetch script');
    }
    const data = await response.json();

    // Transform backend data to EditorBlock
    return data.map((item: any) => ({
        id: item.id.toString(),
        text: item.text,
        speaker: item.speaker,
        durationInSeconds: item.duration || 5.0,
        image: item.image,
        audio: item.audio
    }));
};

export const saveScript = async (blocks: EditorBlock[], generateAudio: boolean = true) => {
    // Transform EditorBlock back to backend format
    const scenes = blocks.map((block, index) => ({
        id: parseInt(block.id) || Date.now() + index,
        speaker: block.speaker,
        text: block.text,
        emotion: "normal",
        action: "none",
        audio: block.audio || "",
        image: block.image,
        duration: block.durationInSeconds
    }));

    const response = await fetch(`${API_BASE}/save?generate_audio=${generateAudio}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenes }),
    });

    if (!response.ok) {
        throw new Error('Failed to save script');
    }

    return response.json();
};

export const uploadImage = async (file: File): Promise<string> => {
    // Try backend upload first
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/upload_image`, {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            return data.url;
        }
    } catch (error) {
        console.warn('Backend upload failed, using local blob URL:', error);
    }

    // Fallback: Create a local blob URL
    // This works for preview but won't persist across sessions
    const blobUrl = URL.createObjectURL(file);
    return blobUrl;
};

// Convert blob URL to base64 for persistence (optional utility)
export const blobUrlToBase64 = (blobUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        fetch(blobUrl)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            })
            .catch(reject);
    });
};

// Upload image and convert to base64 for persistence
export const uploadImageAsBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// ============================================================
// Render API - 動画エクスポート
// ============================================================

export interface RenderStatus {
    status: 'idle' | 'rendering' | 'done' | 'error';
    progress: number;
    error?: string | null;
}

export const startRender = async (blocks: EditorBlock[], imageSpans: ImageSpan[]): Promise<void> => {
    const response = await fetch(`${API_BASE}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks, imageSpans }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || 'Failed to start render');
    }
};

export const getRenderStatus = async (): Promise<RenderStatus> => {
    const response = await fetch(`${API_BASE}/render/status`);
    if (!response.ok) {
        throw new Error('Failed to get render status');
    }
    return response.json();
};

export const getRenderDownloadUrl = (): string => {
    return `${API_BASE}/render/download`;
};
