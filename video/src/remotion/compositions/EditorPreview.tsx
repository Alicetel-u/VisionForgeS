import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, Img, staticFile, Audio, useCurrentFrame, interpolate, spring } from 'remotion';
import { EditorBlock } from '../../editor/types';

interface Props {
    blocks: EditorBlock[];
}

const PreviewBlock: React.FC<{ block: EditorBlock }> = ({ block }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Image Animation: Slow Zoom (Ken Burns)
    // Scale up slightly over the duration of the clip
    const kenBurnsScale = interpolate(
        frame,
        [0, durationInFrames],
        [1, 1.05],
        { extrapolateRight: 'clamp' }
    );

    // Combine manual scale with Ken Burns
    const finalImageScale = (block.imageScale || 1) * kenBurnsScale;

    // Helper for image source
    const getImageSrc = () => {
        if (!block.image) return null;
        if (block.image.startsWith('indexeddb:')) return null;
        if (block.image.startsWith('http') || block.image.startsWith('blob:') || block.image.startsWith('data:')) {
            return block.image;
        }
        return staticFile(block.image);
    };

    const imageSrc = getImageSrc();

    return (
        <AbsoluteFill>
            {block.audio && <Audio src={staticFile(block.audio)} />}

            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {/* Background Image if exists */}
                {imageSrc && (
                    <AbsoluteFill>
                        <Img
                            src={imageSrc}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                // Apply user transform + Ken Burns scale
                                transform: `translate(${block.imageX || 0}px, ${block.imageY || 0}px) scale(${finalImageScale}) rotate(${block.imageRotation || 0}deg)`,
                                transformOrigin: 'center center'
                            }}
                        />
                    </AbsoluteFill>
                )}

                {/* Character Image Placeholder (Overlay) */}
                {!imageSrc && (
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        height: '70%',
                        width: '40%',
                        backgroundColor: '#444',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'end',
                        color: 'white',
                        fontSize: 24,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                    }}>
                        {block.speaker}
                    </div>
                )}

                {/* Text / Caption */}
                <div style={{
                    position: 'absolute',
                    top: '8%',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 10
                }}>
                    <div style={{
                        backgroundColor: '#ff2200',
                        color: 'white',
                        fontSize: 80,
                        fontWeight: 900,
                        fontFamily: '"Mochiy Pop One", "Zen Maru Gothic", sans-serif',
                        border: '8px solid black',
                        borderRadius: 20,
                        padding: '20px 40px',
                        maxWidth: '90%',
                        textAlign: 'center',
                        lineHeight: 1.2,
                        boxShadow: '12px 12px 0 rgba(0,0,0,1)',
                        WebkitTextStroke: '12px black',
                        paintOrder: 'stroke fill',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {block.text}
                    </div>
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

export const EditorPreview: React.FC<Props> = ({ blocks }) => {
    const { fps } = useVideoConfig();

    // Pre-calculate frame positions for each block
    const blockFrames = useMemo(() => {
        const frames: { from: number; duration: number }[] = [];
        let currentFrame = 0;

        blocks.forEach((block) => {
            const durationInFrames = Math.ceil(block.durationInSeconds * fps);
            frames.push({ from: currentFrame, duration: durationInFrames });
            currentFrame += durationInFrames;
        });

        return frames;
    }, [blocks, fps]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {blocks.map((block, index) => {
                const { from, duration } = blockFrames[index] || { from: 0, duration: 60 };
                return (
                    <Sequence key={block.id} from={from} durationInFrames={duration}>
                        <PreviewBlock block={block} />
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
