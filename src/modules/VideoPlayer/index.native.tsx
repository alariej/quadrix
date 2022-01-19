import * as React from 'react';
import * as RX from 'reactxp';
import Video, { OnLoadData } from 'react-native-video';
import { BORDER_RADIUS } from '../../ui';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    image: {
        flex: 1,
        borderRadius: BORDER_RADIUS - 2,
    },
});

interface VideoPlayerProps {
    uri: string;
    setDimensions?: (videoHeight: number, videoWidth: number) => void;
}

export default class VideoPlayer extends RX.Component<VideoPlayerProps, RX.Stateless> {

    private videoPlayer: Video | undefined;

    public render(): JSX.Element {

        return (
            <Video
                ref={ component => this.videoPlayer = component! }
                controls={ true }
                muted={ true }
                // paused={ true }
                source={{ uri: this.props.uri }}
                style={ styles.image }
                useTextureView={ false }
                onLoad={ this.onLoadData }
                // resizeMode={ this.props.resizeMode || 'contain' }
            />
        );
    }

    private onLoadData = (loadInfo: OnLoadData) => {

        console.log('***********************1')
        console.log(loadInfo)
        console.log(this.videoPlayer)

        if (this.props.setDimensions) {
            // const videoElement = e.target as HTMLVideoElement;
            this.props.setDimensions(200, 200);
        }
    };
}
