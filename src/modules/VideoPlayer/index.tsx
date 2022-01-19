import React from 'react';
import RX from 'reactxp';
import { BORDER_RADIUS } from '../../ui';

const video: React.CSSProperties = {
    flex: 1,
    borderRadius: BORDER_RADIUS - 2,
}

interface VideoPlayerProps {
    uri: string;
    setDimensions?: (videoHeight: number, videoWidth: number) => void;
}

export default class VideoPlayer extends RX.Component<VideoPlayerProps, RX.Stateless> {

    // reference:
    // https://github.com/microsoft/reactxp/blob/master/extensions/video/src/web/Video.tsx

    private onLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {

        if (this.props.setDimensions) {
            const videoElement = e.target as HTMLVideoElement;
            this.props.setDimensions(videoElement.videoHeight, videoElement.videoWidth);
        }
    }

    public render(): JSX.Element {

        return (
            <video
                src={ this.props.uri }
                style={ video }
                controls={ true }
                muted={ true }
                onLoadedMetadata={ this.onLoadedMetadata }
            />
        );
    }
}
