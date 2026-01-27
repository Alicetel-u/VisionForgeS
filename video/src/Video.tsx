import { Composition } from 'remotion';
import { HelloWorld } from './HelloWorld';
import { Shorts } from './Shorts';
import catDataRaw from '../public/cat_data.json';

const threadData = catDataRaw as { id: number; duration?: number }[];

const calculateDuration = (targetFps: number) => {
    return threadData.reduce((acc, item) => {
        return acc + Math.ceil((item.duration || 5) * targetFps);
    }, 0);
};

export const RemotionVideo: React.FC = () => {
    const duration30fps = calculateDuration(30);
    const duration24fps = calculateDuration(24);

    return (
        <>
            {/* プレビュー用：軽量版（横型 720p、24fps） */}
            <Composition
                id="Preview"
                component={HelloWorld}
                durationInFrames={duration24fps || 240}
                fps={24}
                width={1280}
                height={720}
                defaultProps={{ isPreview: true }}
            />

            {/* ショート動画用：縦型（720x1280、24fps） */}
            <Composition
                id="Shorts"
                component={Shorts}
                durationInFrames={duration24fps || 240}
                fps={24}
                width={720}
                height={1280}
                defaultProps={{ isPreview: true }}
            />

            {/* 本番用：高品質版（横型 1080p、30fps） */}
            <Composition
                id="VisionForgeLong"
                component={HelloWorld}
                durationInFrames={duration30fps || 300}
                fps={30}
                width={1920}
                height={1080}
                defaultProps={{ isPreview: false }}
            />
        </>
    );
};
