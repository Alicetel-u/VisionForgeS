import { Composition } from 'remotion';
import { HelloWorld } from './HelloWorld';
import newsDataRaw from '../public/news_data.json';

const threadData = newsDataRaw as { id: number; duration?: number }[];
const fps = 30;
const totalDuration = threadData.reduce((acc, item) => {
    return acc + Math.ceil((item.duration || 5) * fps);
}, 0);

export const RemotionVideo: React.FC = () => {
    return (
        <>
            <Composition
                id="VisionForgeLong"
                component={HelloWorld}
                durationInFrames={totalDuration || 300}
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};
