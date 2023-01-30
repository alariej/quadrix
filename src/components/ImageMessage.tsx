import React, { ReactElement } from 'react';
import RX from 'reactxp';
import StringUtils from '../utils/StringUtils';
import ApiClient from '../matrix/ApiClient';
import FullScreenImage from './FullScreenImage';
import { SPACING, BUTTON_ROUND_WIDTH, PAGE_MARGIN, BORDER_RADIUS, TILE_SYSTEM_TEXT } from '../ui';
import UiStore from '../stores/UiStore';
import Spinner from './Spinner';
import CachedImage from '../modules/CachedImage';
import FileMessage from './FileMessage';
import AppFont from '../modules/AppFont';
import { FilteredChatEvent } from '../models/FilteredChatEvent';
import { ImageInfo_, MessageEventContent_ } from '../models/MatrixApi';

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
	svg: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		position: 'absolute',
		right: SPACING,
		top: SPACING,
		fontSize: 9,
		color: TILE_SYSTEM_TEXT,
		borderWidth: 1,
		borderColor: TILE_SYSTEM_TEXT,
		borderRadius: 3,
		padding: 2,
		textAlign: 'center',
	}),
};

interface ImageMessageState {
	showSpinner: boolean;
}

interface ImageMessageProps {
	roomId: string;
	message: FilteredChatEvent;
	animated: boolean;
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

		const content = props.message.content as MessageEventContent_;
		const info = content.info as ImageInfo_;

		if (info?.thumbnail_url) {
			this.url = StringUtils.mxcToHttp(info.thumbnail_url, ApiClient.credentials.homeServer);

			if (info.thumbnail_info!.w && info.thumbnail_info!.h) {
				this.heightStyle = RX.Styles.createViewStyle(
					{
						height: (width * info.thumbnail_info!.h) / info.thumbnail_info!.w,
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

			this.urlFull = StringUtils.mxcToHttp(content.url!, ApiClient.credentials.homeServer);
		} else {
			this.url = StringUtils.mxcToHttp(content.url!, ApiClient.credentials.homeServer);

			if (info?.w && info?.h) {
				this.heightStyle = RX.Styles.createViewStyle(
					{
						height: (width * info?.h) / info?.w,
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
		if (
			this.state.showSpinner ||
			(((this.props.message.content as MessageEventContent_).info as ImageInfo_).mimetype?.includes('svg') &&
				UiStore.getPlatform() !== 'web')
		) {
			return;
		}

		RX.UserInterface.dismissKeyboard();

		const fullScreenImage = (
			<FullScreenImage
				roomId={this.props.roomId}
				eventId={this.props.message.eventId}
				url={this.urlFull}
				imageRatio={this.imageRatio}
				showContextDialog={this.props.showContextDialog}
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

		let svg: ReactElement | undefined;
		let content: ReactElement;
		const info = (this.props.message.content as MessageEventContent_).info as ImageInfo_;
		if (info?.mimetype?.includes('svg') && !info?.thumbnail_url) {
			content = (
				<FileMessage
					message={this.props.message}
					showContextDialog={() => this.props.showContextDialog()}
				/>
			);
		} else {
			svg =
				info?.mimetype?.includes('svg') && info?.thumbnail_url ? (
					<RX.Text style={styles.svg}>SVG</RX.Text>
				) : undefined;
			content = (
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
						mimeType={info?.mimetype}
						animated={this.props.animated}
					/>
					{spinner}
				</RX.View>
			);
		}

		return (
			<RX.View style={styles.containerMessage}>
				{content}
				{svg}
			</RX.View>
		);
	}
}
