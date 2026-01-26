import { Composition } from 'remotion';
import { HelloWorld } from './HelloWorld';

export const RemotionVideo: React.FC = () => {
    return (
        <>
            <Composition
                id="HelloWorld"
                component={HelloWorld}
                durationInFrames={630} // 210フレーム * 3記事 = 630フレーム
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};
