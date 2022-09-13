import React, { ReactElement } from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import { MessageEvent } from '../models/MessageEvent';
import { SPACING, BUTTON_ROUND_WIDTH, PAGE_MARGIN, BORDER_RADIUS, TILE_BACKGROUND, STATUSBAR_BACKGROUND } from '../ui';
import UiStore from '../stores/UiStore';
import FullScreenVideo from './FullScreenVideo';
import CachedImage from '../modules/CachedImage';
import IconSvg, { SvgFile } from './IconSvg';
import StringUtils from '../utils/StringUtils';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		overflow: 'hidden',
		borderRadius: BORDER_RADIUS - 2,
	}),
	videoContainer: RX.Styles.createViewStyle({
		flex: 1,
	}),
	imageContainer: RX.Styles.createViewStyle({
		flex: 1,
	}),
	image: RX.Styles.createImageStyle({
		flex: 1,
	}),
	playIcon: RX.Styles.createViewStyle({
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		alignItems: 'center',
		justifyContent: 'center',
	}),
};

interface VideoMessageProps {
	message: MessageEvent;
	animated: boolean;
	showContextDialog: () => void;
}

export default class VideoMessage extends RX.Component<VideoMessageProps, RX.Stateless> {
	private url = '';
	private heightStyle: RX.Types.ViewStyleRuleSet;
	private isThumbnail: boolean;

	constructor(props: VideoMessageProps) {
		super(props);

		this.isThumbnail = !!props.message.content.info?.thumbnail_url;

		const width =
			UiStore.getAppLayout_().pageWidth - 2 * PAGE_MARGIN - (BUTTON_ROUND_WIDTH + SPACING) - 2 * SPACING;

		this.url = StringUtils.mxcToHttp(props.message.content.url!, ApiClient.credentials.homeServer);

		const w = props.message.content.info?.thumbnail_info?.w || props.message.content.info?.w || 100;
		const h = props.message.content.info?.thumbnail_info?.h || props.message.content.info?.h || 100;

		this.heightStyle = RX.Styles.createViewStyle(
			{
				height: (width * h) / w,
			},
			false
		);
	}

	private showFullScreenVideo = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		RX.UserInterface.dismissKeyboard();

		const fullScreenVideo = (
			<FullScreenVideo
				url={this.url}
				mimeType={this.props.message.content.info?.mimetype || 'video/mp4'}
			/>
		);

		RX.Modal.show(fullScreenVideo, 'fullscreenvideo');
	};

	public render(): JSX.Element | null {
		let video: ReactElement;

		if (this.isThumbnail) {
			const thumbnailUrl = StringUtils.mxcToHttp(
				this.props.message.content.info!.thumbnail_url!,
				ApiClient.credentials.homeServer
			);

			video = (
				<RX.View style={styles.imageContainer}>
					<CachedImage
						resizeMode={'contain'}
						style={styles.image}
						source={thumbnailUrl}
						mimeType={this.props.message.content.info?.thumbnail_info?.mimetype}
						animated={this.props.animated}
					/>
					<RX.View style={styles.playIcon}>
						<IconSvg
							source={require('../resources/svg/RI_play.json') as SvgFile}
							fillColor={TILE_BACKGROUND}
							height={80}
							width={80}
						/>
					</RX.View>
				</RX.View>
			);
		} else {
			video = (
				<RX.View style={[styles.imageContainer, { backgroundColor: STATUSBAR_BACKGROUND }]}>
					<RX.View style={styles.playIcon}>
						<IconSvg
							source={require('../resources/svg/RI_play.json') as SvgFile}
							fillColor={TILE_BACKGROUND}
							height={80}
							width={80}
						/>
					</RX.View>
				</RX.View>
			);
		}

		return (
			<RX.View
				style={[styles.container, this.heightStyle]}
				onPress={this.showFullScreenVideo}
				onLongPress={() => this.props.showContextDialog()}
				onContextMenu={() => this.props.showContextDialog()}
				disableTouchOpacityAnimation={true}
			>
				<RX.View
					style={styles.videoContainer}
					blockPointerEvents={true}
				>
					{video}
				</RX.View>
			</RX.View>
		);
	}
}
