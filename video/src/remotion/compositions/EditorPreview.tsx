import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, Img, staticFile } from 'remotion';
import { EditorBlock } from '../../editor/types';

interface Props {
    blocks: EditorBlock[];
}

export const EditorPreview: React.FC<Props> = ({ blocks }) => {
    const { fps } = useVideoConfig();

    let currentFrame = 0;

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>

            {blocks.map((block) => {
                const durationInFrames = Math.ceil(block.durationInSeconds * fps);
                const from = currentFrame;
                currentFrame += durationInFrames;

                return (
                    <Sequence key={block.id} from={from} durationInFrames={durationInFrames}>
                        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>

                            {/* Background Image if exists */}
                            {block.image && (
                                <AbsoluteFill>
                                    <Img
                                        src={
                                            block.image.startsWith('http') || block.image.startsWith('blob:')
                                                ? block.image
                                                : staticFile(block.image)
                                        }
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </AbsoluteFill>
                            )}

                            {/* Character Image Placeholder (Overlay) */}
                            {!block.image && (
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
                                top: '20%',
                                width: '80%',
                                textAlign: 'center',
                                color: 'white',
                                fontSize: 60,
                                fontWeight: 'bold',
                                textShadow: '0 0 10px rgba(0,0,0,0.8)',
                                fontFamily: 'Keifont, sans-serif',
                                zIndex: 10
                            }}>
                                {block.text}
                            </div>
                        </AbsoluteFill>
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
