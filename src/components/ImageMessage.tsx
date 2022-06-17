import React from 'react';
import RX from 'reactxp';
import StringUtils from '../utils/StringUtils';
import ApiClient from '../matrix/ApiClient';
import { MessageEvent } from '../models/MessageEvent';
import FullScreenImage from './FullScreenImage';
import { SPACING, BUTTON_ROUND_WIDTH, PAGE_MARGIN, BORDER_RADIUS } from '../ui';
import UiStore from '../stores/UiStore';
import Spinner from './Spinner';
import CachedImage from '../modules/CachedImage';

const styles = {
	containerMessage: RX.Styles.createViewStyle({
		cursor: 'pointer',
	}),
	image: RX.Styles.createImageStyle({
		flex: 1,
		borderRadius: BORDER_RADIUS - 2,
	}),
	spinnerContainer: RX.Styles.createViewStyle({
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
	}),
};

interface ImageMessageState {
	showSpinner: boolean;
}

interface ImageMessageProps {
	roomId: string;
	message: MessageEvent;
	showContextDialog: () => void;
}

export default class ImageMessage extends RX.Component<ImageMessageProps, ImageMessageState> {
	private url = '';
	private urlFull = '';
	private heightStyle: RX.Types.ViewStyleRuleSet;
	private imageRatio = 0;
	private isMounted_: boolean | undefined;

	constructor(props: ImageMessageProps) {
		super(props);

		this.state = { showSpinner: false };

		const width =
			UiStore.getAppLayout_().pageWidth - 2 * PAGE_MARGIN - (BUTTON_ROUND_WIDTH + SPACING) - 2 * SPACING;

		if (props.message.content.info?.thumbnail_url) {
			this.url = StringUtils.mxcToHttp(
				this.props.message.content.info?.thumbnail_url!,
				ApiClient.credentials.homeServer
			);

			if (props.message.content.info?.thumbnail_info?.w && props.message.content.info?.thumbnail_info!.h) {
				this.heightStyle = RX.Styles.createViewStyle(
					{
						height:
							(width * props.message.content.info?.thumbnail_info!.h) /
							props.message.content.info?.thumbnail_info!.w,
					},
					false
				);
			} else {
				this.heightStyle = RX.Styles.createViewStyle(
					{
						height: width,
					},
					false
				);
			}

			this.urlFull = StringUtils.mxcToHttp(props.message.content.url!, ApiClient.credentials.homeServer);
		} else {
			this.url = StringUtils.mxcToHttp(props.message.content.url!, ApiClient.credentials.homeServer);

			if (props.message.content.info?.w && props.message.content.info?.h) {
				this.heightStyle = RX.Styles.createViewStyle(
					{
						height: (width * props.message.content.info?.h) / props.message.content.info?.w,
					},
					false
				);
			} else {
				this.heightStyle = RX.Styles.createViewStyle(
					{
						height: width,
					},
					false
				);
			}

			this.urlFull = this.url;
		}
	}

	public componentDidMount(): void {
		this.isMounted_ = true;

		setTimeout(() => {
			if (this.isMounted_) {
				this.setState({ showSpinner: this.imageRatio === 0 });
			}
		}, 500);
	}

	public componentWillUnmount(): void {
		this.isMounted_ = false;
	}

	private showFullScreenImage = () => {
		if (this.state.showSpinner) {
			return;
		}

		RX.UserInterface.dismissKeyboard();

		const fullScreenImage = (
			<FullScreenImage
				roomId={this.props.roomId}
				eventId={this.props.message.eventId}
				url={this.urlFull}
				imageRatio={this.imageRatio}
			/>
		);

		RX.Modal.show(fullScreenImage, 'fullscreenimage');
	};

	private onLoad = (size: RX.Types.Dimensions) => {
		if (this.isMounted_) {
			this.setState({ showSpinner: false });
		}

		this.imageRatio = size.width / size.height;
	};

	public render(): JSX.Element | null {
		const spinner = (
			<RX.View
				style={styles.spinnerContainer}
				blockPointerEvents={!this.state.showSpinner}
			>
				<Spinner isVisible={this.state.showSpinner} />
			</RX.View>
		);

		return (
			<RX.View style={styles.containerMessage}>
				<RX.View
					style={this.heightStyle}
					onPress={this.showFullScreenImage}
					onLongPress={() => this.props.showContextDialog()}
					onContextMenu={() => this.props.showContextDialog()}
					disableTouchOpacityAnimation={true}
				>
					<CachedImage
						resizeMode={'contain'}
						style={styles.image}
						source={this.url}
						onLoad={this.onLoad}
						mimeType={this.props.message.content.info?.mimetype}
						animated={true}
					/>
					{spinner}
				</RX.View>
			</RX.View>
		);
	}
}
