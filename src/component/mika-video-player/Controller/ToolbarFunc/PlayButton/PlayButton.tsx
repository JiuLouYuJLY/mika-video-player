import React, {memo, useCallback, useEffect} from "react";
import PlayIcon from "../Icon/PlayIcon";
import FuncButton, {ToolbarFunc} from "../FuncButton/FuncButton";

import './PlayButton.less';

const PlayButton: ToolbarFunc = memo((props: {
    videoElement?: HTMLVideoElement | null,
}) => {
    const {videoElement} = props;
    const [isPlaying, setIsPlaying] = React.useState(false);

    const onClick = useCallback(() => {
        if (videoElement) {
            if (videoElement.paused) videoElement.play().catch(undefined);
            else videoElement.pause();
            setIsPlaying(!isPlaying);
        }
    }, [videoElement, isPlaying, setIsPlaying]);

    useEffect(() => {
        if (videoElement) {
            videoElement.addEventListener('play', () => setIsPlaying(true));
            videoElement.addEventListener('pause', () => setIsPlaying(false));

            return () => {
                videoElement.removeEventListener('play', () => setIsPlaying(true));
                videoElement.removeEventListener('pause', () => setIsPlaying(false));
            };
        }
    }, [videoElement]);

    return (
        <FuncButton icon={<PlayIcon isPlaying={isPlaying}/>}
                    onClick={onClick}
                    className="mika-video-player-toolbar-func-play-button"/>
    );
});

PlayButton.displayName = 'PlayButton';
export default PlayButton;
