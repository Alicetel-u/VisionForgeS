import { EditorBlock } from './types';

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

export const saveScript = async (blocks: EditorBlock[]) => {
    // Transform EditorBlock back to backend format
    const scenes = blocks.map((block, index) => ({
        id: parseInt(block.id) || Date.now() + index, // Ensure numeric ID for backend if possible, or handle mapping
        speaker: block.speaker,
        text: block.text,
        emotion: "normal", // Default
        action: "none",    // Default
        audio: block.audio || "",
        image: block.image,
        duration: block.durationInSeconds
    }));

    const response = await fetch(`${API_BASE}/save`, {
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
