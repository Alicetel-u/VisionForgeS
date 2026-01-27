import { Composition } from 'remotion';
import { HelloWorld } from './HelloWorld';
import { ZundamonEmotionTest } from './ZundamonEmotionTest';
import catDataRaw from '../public/cat_data.json';

const threadData = catDataRaw as { id: number; duration?: number }[];

const calculateDuration = (targetFps: number) => {
    return threadData.reduce((acc, item) => {
        return acc + Math.ceil((item.duration || 5) * targetFps);
    }, 0);
};

export const RemotionVideo: React.FC = () => {
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
            <Composition
                id="ZundamonEmotionTest"
                component={ZundamonEmotionTest}
                durationInFrames={24 * 2 * 6} // 6 emotions * 2 seconds
                fps={24}
                width={1280}
                height={720}
            />
        </>
    );
};
