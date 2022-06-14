import React from 'react';
import RX from 'reactxp';
import ScreenOrientation from '../modules/ScreenOrientation';
import VideoPlayer from '../modules/VideoPlayer';
import { OPAQUE_DARK_BACKGROUND, TRANSPARENT_BACKGROUND } from '../ui';

const styles = {
	modalView: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		backgroundColor: OPAQUE_DARK_BACKGROUND,
	}),
	closeButton: RX.Styles.createButtonStyle({
		position: 'absolute',
		top: 0,
		bottom: 72,
		left: 0,
		right: 0,
		backgroundColor: TRANSPARENT_BACKGROUND,
		cursor: 'pointer',
	}),
};

interface FullScreenVideoProps {
	url: string;
	mimeType: string;
}

export default class FullScreenVideo extends RX.Component<FullScreenVideoProps, RX.Stateless> {
	constructor(props: FullScreenVideoProps) {
		super(props);

		ScreenOrientation.hideStatusBar(true);
	}

	private onPressCloseButton = () => {
		ScreenOrientation.hideStatusBar(false);

		RX.Modal.dismiss('fullscreenvideo');
	};

	public render(): JSX.Element | null {
		return (
			<RX.View style={styles.modalView}>
				<VideoPlayer
					uri={this.props.url}
					mimeType={this.props.mimeType || 'video/mp4'}
					autoplay={true}
				/>
				<RX.View
					style={styles.closeButton}
					onPress={this.onPressCloseButton}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				/>
			</RX.View>
		);
	}
}
