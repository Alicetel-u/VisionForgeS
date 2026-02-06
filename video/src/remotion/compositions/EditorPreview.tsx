import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, Img, staticFile, Audio } from 'remotion';
import { EditorBlock } from '../../editor/types';

interface Props {
    blocks: EditorBlock[];
}

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

                // Determine image source
                const getImageSrc = () => {
                    if (!block.image) return null;
                    if (block.image.startsWith('http') ||
                        block.image.startsWith('blob:') ||
                        block.image.startsWith('data:')) {
                        return block.image;
                    }
                    return staticFile(block.image);
                };

                const imageSrc = getImageSrc();

                return (
                    <Sequence key={block.id} from={from} durationInFrames={duration}>
                        {block.audio && <Audio src={staticFile(block.audio)} />}
                        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>

                            {/* Background Image if exists */}
                            {imageSrc && (
                                <AbsoluteFill>
                                    <Img
                                        src={imageSrc}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transform: `translate(${block.imageX || 0}px, ${block.imageY || 0}px) scale(${block.imageScale || 1}) rotate(${block.imageRotation || 0}deg)`,
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
                                top: '15%',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                zIndex: 10
                            }}>
                                <div style={{
                                    backgroundColor: '#ff2200',
                                    color: 'white',
                                    fontSize: 56,
                                    fontWeight: 900,
                                    fontFamily: '"Mochiy Pop One", "Zen Maru Gothic", sans-serif',
                                    border: '6px solid black',
                                    padding: '10px 20px',
                                    maxWidth: '90%',
                                    textAlign: 'center',
                                    lineHeight: 1.2,
                                    boxShadow: '8px 8px 0 rgba(0,0,0,0.5)',
                                    WebkitTextStroke: '3.5px black',
                                    paintOrder: 'stroke fill'
                                }}>
                                    {block.text}
                                </div>
                            </div>
                        </AbsoluteFill>
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
