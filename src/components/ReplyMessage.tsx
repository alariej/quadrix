import React, { ReactElement } from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import { FilteredChatEvent } from '../models/FilteredChatEvent';
import { ImageInfo_, MessageEventContent_, VideoInfo_ } from '../models/MatrixApi';
import AppFont from '../modules/AppFont';
import CachedImage from '../modules/CachedImage';
import DataStore from '../stores/DataStore';
import UiStore from '../stores/UiStore';
import { jitsiStartedInternal } from '../translations';
import {
	BORDER_RADIUS,
	BUTTON_FILL,
	COMPOSER_BORDER,
	FONT_NORMAL,
	SPACING,
	TILE_BACKGROUND,
	TILE_SYSTEM_TEXT,
} from '../ui';
import StringUtils from '../utils/StringUtils';
import IconSvg, { SvgFile } from './IconSvg';

const styles = {
	replyContainer: RX.Styles.createViewStyle({
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		padding: SPACING,
		borderRadius: BORDER_RADIUS,
		borderBottomWidth: 1,
		marginBottom: SPACING,
		borderColor: COMPOSER_BORDER,
	}),
	textReplySender: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: TILE_SYSTEM_TEXT,
		fontStyle: 'italic',
	}),
	textReplyMessage: RX.Styles.createTextStyle({
		flex: 1,
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: TILE_SYSTEM_TEXT,
		wordBreak: 'break-word',
	}),
	replyImageContainer: RX.Styles.createViewStyle({
		flexDirection: 'row',
		height: 32,
		alignItems: 'center',
	}),
	replyImage: RX.Styles.createImageStyle({
		width: 32,
		height: 32,
		borderRadius: BORDER_RADIUS,
	}),
	containerButton: RX.Styles.createViewStyle({
		flex: 1,
		minWidth: 16,
	}),
	cancelButton: RX.Styles.createViewStyle({
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: BUTTON_FILL,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'flex-end',
		marginLeft: SPACING,
	}),
	cancelIcon: RX.Styles.createViewStyle({
		transform: [{ rotate: '45deg' }],
	}),
};

interface ReplyMessageProps {
	replyEvent: FilteredChatEvent;
	roomId: string;
	onPress?: (eventId: string) => void;
	onCancelButton?: () => void;
}

export default class ReplyMessage extends RX.Component<ReplyMessageProps, RX.Stateless> {
	private getUserDisplayName = (userId: string): string => {
		const roomSummary = DataStore.getRoomSummary(this.props.roomId);
		if (roomSummary.type === 'community') {
			return userId;
		} else {
			return roomSummary.members[userId]?.name || userId.split('@')[1].split(':')[0];
		}
	};

	private onReplyPress = () => {
		if (this.props.onCancelButton) {
			return;
		}

		this.props.onPress!(this.props.replyEvent.eventId);
	};

	public render(): ReactElement | null {
		const userDisplayName = this.getUserDisplayName(this.props.replyEvent.senderId);
		const maxChar = this.props.onCancelButton ? 10 : 20;

		const userName = (
			<RX.Text
				style={styles.textReplySender}
				numberOfLines={1}
			>
				{userDisplayName.substring(0, maxChar).concat(userDisplayName.length > maxChar ? '...' : '') + '  '}
			</RX.Text>
		);

		let replyContent: ReactElement;
		const content = this.props.replyEvent.content as MessageEventContent_;
		if (content.msgtype === 'm.image') {
			const source = StringUtils.mxcToHttp(content.url!, ApiClient.credentials.homeServer);
			replyContent = (
				<RX.View style={styles.replyImageContainer}>
					{userName}
					<CachedImage
						resizeMode={'cover'}
						style={styles.replyImage}
						source={source}
						mimeType={(content.info as ImageInfo_).mimetype}
						animated={false}
					/>
				</RX.View>
			);
		} else if (content.msgtype === 'm.video') {
			const info = content.info as VideoInfo_;
			const thumbnailUrl = info.thumbnail_url;

			if (thumbnailUrl) {
				replyContent = (
					<RX.View style={styles.replyImageContainer}>
						{userName}
						<CachedImage
							resizeMode={'cover'}
							style={styles.replyImage}
							source={StringUtils.mxcToHttp(thumbnailUrl, ApiClient.credentials.homeServer)}
							mimeType={info.mimetype}
							animated={false}
						/>
					</RX.View>
				);
			} else {
				replyContent = (
					<RX.Text
						style={styles.textReplyMessage}
						numberOfLines={this.props.onCancelButton ? 1 : undefined}
					>
						{userName}
						{content.body!}
					</RX.Text>
				);
			}
		} else if (content._jitsi_started) {
			const language = UiStore.getLanguage();

			replyContent = (
				<RX.Text
					style={styles.textReplyMessage}
					numberOfLines={this.props.onCancelButton ? 1 : undefined}
				>
					{userName}
					{jitsiStartedInternal[language]}
				</RX.Text>
			);
		} else {
			const stripped = StringUtils.stripReplyMessage(content.body!);
			const strippedFlattened = StringUtils.flattenString(stripped);
			replyContent = (
				<RX.Text
					style={styles.textReplyMessage}
					numberOfLines={this.props.onCancelButton ? 1 : undefined}
				>
					{userName}
					{strippedFlattened}
				</RX.Text>
			);
		}

		let cancelButton: ReactElement | undefined;
		if (this.props.onCancelButton) {
			cancelButton = (
				<RX.View style={styles.containerButton}>
					<RX.Button
						style={styles.cancelButton}
						onPress={this.props.onCancelButton}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					>
						<IconSvg
							source={require('../resources/svg/RI_plus.json') as SvgFile}
							style={styles.cancelIcon}
							fillColor={TILE_BACKGROUND}
							height={14}
							width={14}
						/>
					</RX.Button>
				</RX.View>
			);
		}

		return (
			<RX.View
				style={[styles.replyContainer, { cursor: this.props.onCancelButton ? 'default' : 'pointer' }]}
				onPress={this.onReplyPress}
			>
				{replyContent}
				{cancelButton}
			</RX.View>
		);
	}
}
