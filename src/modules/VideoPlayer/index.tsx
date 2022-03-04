import React from 'react';
import RX from 'reactxp';

const video: React.CSSProperties = {
    height: '100%',
    width: '100%',
    padding: '0px',
    margin: '0px'
}

interface VideoPlayerProps {
    uri: string;
    mimeType: string;
    autoplay: boolean;
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
                src={ this.props.uri + '#t=0.001' }
                style={ video }
                controls={ true }
                muted={ true }
                autoPlay={ this.props.autoplay }
                disablePictureInPicture={ true }
                onLoadedMetadata={ this.onLoadedMetadata }
            />
        );
    }
}
