import { Composition } from 'remotion';
import { HelloWorld } from './HelloWorld';

export const RemotionVideo: React.FC = () => {
    return (
        <>
            <Composition
                id="HelloWorld"
                component={HelloWorld}
                durationInFrames={450} // 30fps * 15秒 = 450フレーム
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};
