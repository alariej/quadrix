import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { DIALOG_WIDTH, OPAQUE_BACKGROUND, SPACING } from '../../ui';
import Spinner from '../../components/Spinner';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		overflow: 'hidden',
	}),
	spinnerContainer: RX.Styles.createViewStyle({
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: OPAQUE_BACKGROUND,
	}),
};

interface VideoPlayerProps {
	uri: string;
	mimeType: string;
	autoplay: boolean;
	setDimensions?: (videoHeight: number, videoWidth: number) => void;
}

interface VideoPlayerState {
	height: number | undefined;
	showSpinner: boolean;
}

export default class VideoPlayer extends RX.Component<VideoPlayerProps, VideoPlayerState> {
	private html: string;

	constructor(props: VideoPlayerProps) {
		super(props);

		const mimeType = props.mimeType === 'video/*' ? 'video/mp4' : props.mimeType;

		this.state = { height: undefined, showSpinner: true };

		const autoplay = props.autoplay ? 'autoplay' : undefined;

		this.html = `
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
                            style="background-color: black"
                            onloadedmetadata="onLoadedMetadata(this.videoHeight, this.videoWidth)"
                            height="100%"
                            width="100%"
                            ${autoplay!}
                            disablepictureinpicture
                            muted
                            playsinline
                            webkit-playsinline
                        >
                            <source src="${props.uri}#t=0.001" type="${mimeType}"/>
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

	private onMessage = (message: WebViewMessageEvent) => {
		this.setState({ showSpinner: false });

		if (this.props.setDimensions) {
			const dimensions = JSON.parse(message.nativeEvent.data) as { height: number; width: number };
			this.setState({
				height: (dimensions.height * (DIALOG_WIDTH - 2 * SPACING)) / dimensions.width,
			});
			this.props.setDimensions(dimensions.height, dimensions.width);
		}
	};

	public render(): JSX.Element {
		let spinner: ReactElement | undefined;
		if (this.state.showSpinner) {
			spinner = (
				<RX.View style={styles.spinnerContainer}>
					<Spinner isVisible={true} />
				</RX.View>
			);
		}

		return (
			<RX.View style={[styles.container, { height: this.state.height || 320 }]}>
				<WebView
					scrollEnabled={false}
					originWhitelist={['*']}
					source={{
						html: this.html,
					}}
					onMessage={this.onMessage}
					mediaPlaybackRequiresUserAction={false}
					allowsInlineMediaPlayback={true}
					allowsFullscreenVideo={false}
					allowFileAccess={true}
					javaScriptEnabled={true}
				/>
				{spinner}
			</RX.View>
		);
	}
}
