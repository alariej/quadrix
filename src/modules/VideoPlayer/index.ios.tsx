import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { DIALOG_WIDTH, SPACING } from '../../ui';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { WebViewSource } from 'react-native-webview/lib/WebViewTypes';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
        overflow: 'hidden',
    }),
}

interface VideoPlayerProps {
    uri: string;
    mimeType: string;
    autoplay: boolean;
    setDimensions?: (videoHeight: number, videoWidth: number) => void;
}

interface VideoPlayerState {
    height: number | undefined;
    html: string | undefined;
}

export default class VideoPlayer extends RX.Component<VideoPlayerProps, VideoPlayerState> {

    private html: string | undefined;
    private isLocalUri: boolean;
    private autoplay: string | undefined;

    constructor(props: VideoPlayerProps) {
        super(props);

        this.isLocalUri = props.uri.includes('file://');

        this.autoplay = props.autoplay ? 'autoplay' : undefined;

        this.state = { height: undefined, html: undefined };

        if (!this.isLocalUri) {
            this.html =
                `
                <!DOCTYPE html>
                <html style="height: 100%; width: 100%">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
                    </head>
                    <style>
                        *:focus {
                            outline: 0;
                            box-shadow: none;
                        }
                        .videoControls
                            :is(media-play-button, media-mute-button, media-time-display) {
                                opacity: 0.4;
                                height: 32px;
                                padding: 6px;
                                background-color: black;
                            }
                    </style>
                    <body style="height: 100%; width: 100%; display: flex; padding: 0px; margin: 0px">
                        <script type="module" src="https://cdn.jsdelivr.net/npm/media-chrome@0.5.0/dist/index.min.js"></script>
                        <script type="text/javascript">
                            const onLoadedMetadata = (height, width) => {
                                const dimensions = {
                                    height: height,
                                    width: width,
                                }
                                const dimensions_ = JSON.stringify(dimensions);
                                window.ReactNativeWebView.postMessage(dimensions_);
                            };
                        </script>
                        <media-controller autohide="-1" style="height: 100%; width: 100%">
                            <video
                                slot="media"
                                style="background-color: white"
                                onloadedmetadata="onLoadedMetadata(this.videoHeight, this.videoWidth)"
                                height="100%"
                                width="100%"
                                ${ this.autoplay! }
                                disablepictureinpicture
                                muted
                                playsinline
                                webkit-playsinline
                            >
                                <source src="${ props.uri }#t=0.001" type="${ props.mimeType }">
                            </video>
                            <div style="display: flex; align-self: stretch; justify-content: center;">
                                <media-control-bar class="videoControls">
                                    <media-play-button></media-play-button>
                                    <media-mute-button></media-mute-button>
                                    <media-time-display show-duration></media-time-display>
                                </media-control-bar>
                            </div>
                        </media-controller>
                    </body>
                </html>
                `;
        }
    }

    public async componentDidMount(): Promise<void> {

        if (!this.isLocalUri) { return; }

        const videoPathTemp = ReactNativeBlobUtil.fs.dirs.CacheDir + '/temp.xyz';

        const tempExists = await ReactNativeBlobUtil.fs.exists(videoPathTemp).catch(_err => null);

        if (tempExists) {
            await ReactNativeBlobUtil.fs.unlink(videoPathTemp).catch(_err => null);
        }

        await ReactNativeBlobUtil.fs.cp(this.props.uri.replace('file://', ''), videoPathTemp).catch(_err => null);

        const html =
            `
            <!DOCTYPE html>
            <html style="height: 100%; width: 100%">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
                </head>
                <style>
                    *:focus {
                        outline: 0;
                        box-shadow: none;
                    }
                    .videoControls
                        :is(media-play-button, media-mute-button, media-time-display) {
                            opacity: 0.4;
                            height: 32px;
                            padding: 6px;
                            background-color: black;
                        }
                </style>
                <body style="height: 100%; width: 100%; display: flex; padding: 0px; margin: 0px">
                    <script type="module" src="https://cdn.jsdelivr.net/npm/media-chrome@0.5.0/dist/index.min.js"></script>
                    <script type="text/javascript">
                        const onLoadedMetadata = (height, width) => {
                            const dimensions = {
                                height: height,
                                width: width,
                            }
                            const dimensions_ = JSON.stringify(dimensions);
                            window.ReactNativeWebView.postMessage(dimensions_);
                        };
                    </script>
                    <media-controller autohide="-1" style="height: 100%; width: 100%">
                        <video
                            slot="media"
                            style="background-color: white"
                            onloadedmetadata="onLoadedMetadata(this.videoHeight, this.videoWidth)"
                            height="100%"
                            width="100%"
                            ${ this.autoplay! }
                            disablepictureinpicture
                            muted
                            playsinline
                            webkit-playsinline
                        >
                            <source src="${ videoPathTemp }#t=0.001" type="${ this.props.mimeType }">
                        </video>
                        <div style="display: flex; align-self: stretch; justify-content: center;">
                            <media-control-bar class="videoControls">
                                <media-play-button></media-play-button>
                                <media-mute-button></media-mute-button>
                                <media-time-display show-duration></media-time-display>
                            </media-control-bar>
                        </div>
                    </media-controller>
                </body>
            </html>
            `;

        await ReactNativeBlobUtil.fs.writeFile(ReactNativeBlobUtil.fs.dirs.CacheDir + '/temp.html', html, 'utf8')
            .catch(_error => null);

        this.setState({ html: 'file://' + ReactNativeBlobUtil.fs.dirs.CacheDir + '/temp.html' })
    }

    public async componentWillUnmount(): Promise<void> {

        if (!this.isLocalUri) { return; }

        await ReactNativeBlobUtil.fs.unlink(ReactNativeBlobUtil.fs.dirs.CacheDir + '/temp.xyz').catch(_error => null);
        await ReactNativeBlobUtil.fs.unlink(ReactNativeBlobUtil.fs.dirs.CacheDir + '/temp.html').catch(_error => null);
    }

    private onMessage = (message: WebViewMessageEvent) => {

        if (this.props.setDimensions) {
            const dimensions = JSON.parse(message.nativeEvent.data) as { height: number, width: number };
            this.setState({
                height: (dimensions.height * (DIALOG_WIDTH - 2 * SPACING) / dimensions.width),
            });
            this.props.setDimensions(dimensions.height, dimensions.width);
        }
    }

    public render(): JSX.Element | null {

        let source: WebViewSource | undefined;
        if (this.html) {
            source = { html: this.html }
        } else if (this.state.html) {
            source = { uri: this.state.html }
        }

        let webView: ReactElement | undefined;
        if (source) {
            webView =
                <WebView
                    scrollEnabled={ false }
                    originWhitelist={ ['*'] }
                    source={ source }
                    onMessage={ this.onMessage }
                    mediaPlaybackRequiresUserAction={ false }
                    allowsInlineMediaPlayback={ true }
                    allowsFullscreenVideo={ false }
                    allowFileAccess={ true }
                    javaScriptEnabled={ true }
                    allowingReadAccessToURL={ ReactNativeBlobUtil.fs.dirs.CacheDir }
                />
        }

        return (
            <RX.View style={ [styles.container, { height: this.state.height || 400 }] }>
                { webView }
            </RX.View>
        );
    }
}
