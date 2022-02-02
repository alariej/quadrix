import React from 'react';
import RX from 'reactxp';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { DIALOG_WIDTH, SPACING } from '../../ui';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
        overflow: 'hidden',
    }),
}

interface VideoPlayerProps {
    uri: string;
    autoplay: boolean;
    setDimensions?: (videoHeight: number, videoWidth: number) => void;
}

interface VideoPlayerState {
    height: number | undefined;
}

export default class VideoPlayer extends RX.Component<VideoPlayerProps, VideoPlayerState> {

    private html: string;

    constructor(props: VideoPlayerProps) {
        super(props);

        this.state = { height: undefined };

        const autoplay = props.autoplay ? "autoplay" : undefined;

        this.html =
            `
            <!DOCTYPE html>
            <html style="height: 100%; width: 100%">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
                </head>
                <body style="height: 100%; width: 100%; display: flex; padding: 0px; margin: 0px">
                    <script type="text/javascript">
                        let videoPlayer;
                        const onLoadedMetadata = (height, width) => {
                            const dimensions = {
                                height: height,
                                width: width,
                            }
                            const dimensions_ = JSON.stringify(dimensions);
                            window.ReactNativeWebView.postMessage(dimensions_);
                            videoPlayer = document.getElementById("videoPlayer");
                        };
                    </script>
                    <video
                        id="videoPlayer"
                        style="background-color: black"
                        src="${ props.uri }#t=0.001"
                        onloadedmetadata="onLoadedMetadata(this.videoHeight, this.videoWidth)"
                        height="100%"
                        width="100%"
                        ${ autoplay! }
                        controls
                        muted
                    />
                </body>
            </html>
            `;
    }

    private onMessage = (message: WebViewMessageEvent) => {

        const dimensions = JSON.parse(message.nativeEvent.data) as { height: number, width: number };

        if (this.props.setDimensions) {
            this.setState({
                height: (dimensions.height * (DIALOG_WIDTH - 2 * SPACING) / dimensions.width),
            });
            this.props.setDimensions(dimensions.height, dimensions.width);
        }
    }

    public render(): JSX.Element {

        return (
            <RX.View style={ [styles.container, { height: this.state.height }] }>
                <WebView
                    scrollEnabled={ false }
                    originWhitelist={ ['*'] }
                    source={{
                        html: this.html,
                    }}
                    onMessage={ this.onMessage }
                    mediaPlaybackRequiresUserAction={ false }
                    allowsInlineMediaPlayback={ true }
                    allowsFullscreenVideo={ false }
                    allowFileAccess={ true }
                    javaScriptEnabled={ true }
                />
            </RX.View>
        );
    }
}
