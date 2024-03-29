import React, { ReactElement } from 'react';
import RX from 'reactxp';
import {
	TILE_BACKGROUND,
	FOOTER_TEXT,
	SPACING,
	FONT_NORMAL,
	TILE_SYSTEM_TEXT,
	BUTTON_ROUND_WIDTH,
	TRANSPARENT_BACKGROUND,
	MARKER_READ_FILL,
	MARKER_SENT_FILL,
	TILE_BACKGROUND_OWN,
	PAGE_MARGIN,
	SENDER_TEXT,
	ICON_INFO_FILL,
	BORDER_RADIUS_CHAT,
	CONTENT_BACKGROUND,
	FONT_MEDIUM,
} from '../ui';
import ImageMessage from './ImageMessage';
import FileMessage from './FileMessage';
import TextMessage from './TextMessage';
import ApiClient from '../matrix/ApiClient';
import DialogMessageTile from '../dialogs/DialogMessageTile';
import { encryptedMessage, deleted } from '../translations';
import UiStore from '../stores/UiStore';
import IconSvg, { SvgFile } from './IconSvg';
import { format } from 'date-fns';
import { MessageEventContent_, RoomType } from '../models/MatrixApi';
import Spinner from './Spinner';
import AppFont from '../modules/AppFont';
import VideoMessage from './VideoMessage';
import DataStore from '../stores/DataStore';
import ReplyMessage from './ReplyMessage';
import Shadow from '../modules/Shadow';
import { FilteredChatEvent } from '../models/FilteredChatEvent';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		overflow: 'visible',
		backgroundColor: TRANSPARENT_BACKGROUND,
	}),
	containerTile: RX.Styles.createViewStyle({
		borderRadius: BORDER_RADIUS_CHAT,
		marginBottom: SPACING,
		padding: SPACING,
		minWidth: 84,
		overflow: 'visible',
		shadowOffset: Shadow.small.offset,
		shadowColor: Shadow.small.color,
		shadowRadius: Shadow.small.radius,
		elevation: Shadow.small.elevation,
		shadowOpacity: Shadow.small.opacity,
	}),
	containerMessage: RX.Styles.createViewStyle({
		flex: 1,
		overflow: 'visible',
	}),
	containerFooter: RX.Styles.createViewStyle({
		flexDirection: 'row',
		marginTop: 8,
		overflow: 'visible',
	}),
	footer: RX.Styles.createViewStyle({
		flex: 1,
		flexDirection: 'row',
		overflow: 'visible',
	}),
	footerDetails: RX.Styles.createViewStyle({
		flex: 1,
		flexDirection: 'column',
		overflow: 'visible',
	}),
	footerSenderId: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		flexShrink: 1,
		fontSize: FONT_NORMAL,
		color: SENDER_TEXT,
		overflow: 'visible',
	}),
	footerTimestamp: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		flexShrink: 0,
		fontSize: FONT_NORMAL,
		color: FOOTER_TEXT,
		marginRight: SPACING,
	}),
	containerMarker: RX.Styles.createViewStyle({
		flex: 1,
		overflow: 'visible',
	}),
	markerText: RX.Styles.createTextStyle({
		position: 'absolute',
		top: 0,
		right: 17,
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_MEDIUM,
		color: MARKER_READ_FILL,
	}),
	spinner: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'flex-end',
		marginRight: SPACING,
		overflow: 'visible',
	}),
	containerText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		flex: 1,
		fontSize: FONT_NORMAL,
		minHeight: FONT_NORMAL + 7,
		color: TILE_SYSTEM_TEXT,
	}),
	containerCorner: RX.Styles.createViewStyle({
		position: 'absolute',
		bottom: 0,
		height: 1,
		backgroundColor: CONTENT_BACKGROUND,
		overflow: 'visible',
		shadowOffset: Shadow.small.offset,
		shadowColor: Shadow.small.color,
		shadowRadius: Shadow.small.radius,
		elevation: Shadow.small.elevation,
		shadowOpacity: Shadow.small.opacity,
	}),
};

interface MessageTileProps {
	roomId: string;
	event: FilteredChatEvent;
	roomType: RoomType;
	readMarker?: { read: number; total: number };
	replyMessage?: FilteredChatEvent;
	setReplyMessage: (message: FilteredChatEvent) => void;
	onPressReply?: (eventId: string) => void;
	showTempForwardedMessage?: (roomId: string, message?: FilteredChatEvent, tempId?: string) => void;
	canPress?: boolean;
	isRedacted: boolean;
	body?: string;
	withSenderDetails?: boolean | undefined;
	animatedImage: boolean;
}

export default class MessageTile extends RX.Component<MessageTileProps, RX.Stateless> {
	private mainTile: RX.View | undefined;
	private tileStyle: RX.Types.ViewStyleRuleSet;

	public shouldComponentUpdate(nextProps: MessageTileProps): boolean {
		return (
			this.props.readMarker?.read !== nextProps.readMarker?.read ||
			this.props.isRedacted !== nextProps.isRedacted ||
			this.props.body !== nextProps.body ||
			this.props.withSenderDetails !== nextProps.withSenderDetails
		);
	}

	private showContextDialog = () => {
		if (this.props.isRedacted) {
			return;
		}

		RX.UserInterface.dismissKeyboard();

		RX.UserInterface.measureLayoutRelativeToWindow(this.mainTile!)
			.then(layout => {
				const dialogMessageTile = (
					<DialogMessageTile
						roomId={this.props.roomId}
						event={this.props.event}
						layout={layout}
						roomType={this.props.roomType}
						replyMessage={this.props.replyMessage}
						setReplyMessage={this.props.setReplyMessage}
						showTempForwardedMessage={this.props.showTempForwardedMessage}
					/>
				);

				RX.Modal.show(dialogMessageTile, 'dialogMessageTile');
			})
			.catch(_error => null);
	};

	public render(): JSX.Element | null {
		let message: ReactElement;
		let messageType: string;

		let replyMessage: ReactElement | undefined;
		if (this.props.replyMessage) {
			replyMessage = (
				<ReplyMessage
					replyEvent={this.props.replyMessage}
					roomId={this.props.roomId}
					onPress={this.props.onPressReply}
				/>
			);
		}

		const content = this.props.event.content as MessageEventContent_;
		if (this.props.isRedacted) {
			messageType = 'system';
			const messageIcon = (
				<IconSvg
					source={require('../resources/svg/RI_msg_delete.json') as SvgFile}
					style={{ marginRight: SPACING }}
					fillColor={ICON_INFO_FILL}
					height={16}
					width={16}
				/>
			);
			message = (
				<RX.View style={{ flexDirection: 'row' }}>
					{messageIcon}
					<RX.Text style={styles.containerText}>{deleted[UiStore.getLanguage()]}</RX.Text>
				</RX.View>
			);
		} else if (this.props.event.type === 'm.room.encrypted') {
			messageType = 'system';
			const messageIcon = (
				<IconSvg
					source={require('../resources/svg/RI_encrypted.json') as SvgFile}
					style={{ marginRight: SPACING }}
					fillColor={ICON_INFO_FILL}
					height={16}
					width={16}
				/>
			);
			message = (
				<RX.View style={{ flexDirection: 'row' }}>
					{messageIcon}
					<RX.Text style={styles.containerText}>{encryptedMessage[UiStore.getLanguage()]}</RX.Text>
				</RX.View>
			);
		} else if (content.msgtype === 'm.image') {
			messageType = 'media';
			message = (
				<ImageMessage
					roomId={this.props.roomId}
					message={this.props.event}
					animated={this.props.animatedImage}
					showContextDialog={this.showContextDialog}
					// body={this.props.body || ''}
				/>
			);
		} else if (content.msgtype === 'm.video') {
			messageType = 'media';
			message = (
				<VideoMessage
					message={this.props.event}
					animated={this.props.animatedImage}
					showContextDialog={this.showContextDialog}
					// body={this.props.body || ''}
				/>
			);
		} else if (content.msgtype === 'm.file') {
			messageType = 'file';
			message = (
				<FileMessage
					message={this.props.event}
					showContextDialog={this.showContextDialog}
					// body={this.props.body || ''}
				/>
			);
		} else {
			messageType = 'text';
			message = (
				<TextMessage
					roomId={this.props.roomId}
					message={this.props.event}
					showContextDialog={this.showContextDialog}
					body={this.props.body || ''}
				/>
			);
		}

		const marginMin = BUTTON_ROUND_WIDTH + SPACING;
		const isOwnMessage = this.props.event.senderId === ApiClient.credentials.userIdFull;

		let marginLeft;
		let marginRight;
		let alignSelf: RX.Types.FlexboxParentStyle['alignSelf'];
		let backgroundColor;

		if (this.props.roomType === 'notepad') {
			marginLeft = marginMin / 2;
			marginRight = marginMin / 2;
			alignSelf = undefined;
			backgroundColor = TILE_BACKGROUND;
		} else if (messageType === 'media') {
			marginLeft = isOwnMessage ? marginMin : 0;
			marginRight = isOwnMessage ? 0 : marginMin;
			alignSelf = undefined;
			backgroundColor = isOwnMessage ? TILE_BACKGROUND_OWN : TILE_BACKGROUND;
		} else {
			marginLeft = isOwnMessage ? marginMin : 0;
			marginRight = isOwnMessage ? 0 : marginMin;
			alignSelf = isOwnMessage ? 'flex-end' : 'flex-start';
			backgroundColor = isOwnMessage ? TILE_BACKGROUND_OWN : TILE_BACKGROUND;
		}

		let borderBottomLeftRadius;
		let borderBottomRightRadius;

		if (['direct', 'group'].includes(this.props.roomType)) {
			(borderBottomLeftRadius = isOwnMessage ? 0 : BORDER_RADIUS_CHAT),
				(borderBottomRightRadius = isOwnMessage ? BORDER_RADIUS_CHAT : 0);
		} else {
			borderBottomLeftRadius = BORDER_RADIUS_CHAT;
			borderBottomRightRadius = BORDER_RADIUS_CHAT;
		}

		this.tileStyle = RX.Styles.createViewStyle(
			{
				marginLeft: marginLeft,
				marginRight: marginRight,
				alignSelf: this.props.withSenderDetails ? undefined : alignSelf,
				backgroundColor: backgroundColor,
				borderBottomLeftRadius: borderBottomLeftRadius,
				borderBottomRightRadius: borderBottomRightRadius,
			},
			false
		);

		const timestamp = format(this.props.event.time, 'HH:mm');

		const width =
			UiStore.getAppLayout_().pageWidth - 2 * PAGE_MARGIN - (BUTTON_ROUND_WIDTH + SPACING) - 2 * SPACING;

		let footer: ReactElement;
		if (
			this.props.roomType !== 'direct' &&
			ApiClient.credentials.userIdFull !== this.props.event.senderId &&
			!this.props.withSenderDetails
		) {
			const senderInfo =
				this.props.roomType === 'group'
					? DataStore.getMemberName(this.props.roomId, this.props.event.senderId)
					: this.props.event.senderId;

			footer = (
				<RX.View style={[styles.footer, { maxWidth: width }]}>
					<RX.Text
						allowFontScaling={false}
						style={styles.footerSenderId}
						numberOfLines={1}
					>
						{senderInfo}
					</RX.Text>
					<RX.Text
						allowFontScaling={false}
						style={styles.footerTimestamp}
					>
						{' - ' + timestamp}
					</RX.Text>
				</RX.View>
			);
		} else if (this.props.withSenderDetails) {
			const memberName = DataStore.getMemberName(this.props.roomId, this.props.event.senderId);

			let senderName: ReactElement | undefined;
			if (memberName !== this.props.event.senderId) {
				senderName = (
					<RX.Text
						allowFontScaling={false}
						style={styles.footerSenderId}
					>
						{memberName}
					</RX.Text>
				);
			}

			const dateStamp = format(this.props.event.time, 'd MMMM yyyy', { locale: UiStore.getLocale() });

			footer = (
				<RX.View style={[styles.footerDetails, { maxWidth: width }]}>
					{senderName}
					<RX.Text
						allowFontScaling={false}
						style={styles.footerSenderId}
					>
						{this.props.event.senderId}
					</RX.Text>
					<RX.Text
						allowFontScaling={false}
						style={styles.footerTimestamp}
					>
						{dateStamp + ' - ' + timestamp}
					</RX.Text>
				</RX.View>
			);
		} else {
			footer = (
				<RX.Text
					allowFontScaling={false}
					style={styles.footerTimestamp}
				>
					{timestamp}
				</RX.Text>
			);
		}

		let readMarker: ReactElement | null = null;
		if (ApiClient.credentials.userIdFull === this.props.event.senderId) {
			if (this.props.roomType !== 'notepad' && this.props.readMarker && this.props.readMarker.read !== -1) {
				if (this.props.readMarker.read === 0) {
					readMarker = (
						<RX.View style={styles.containerMarker}>
							<IconSvg
								source={require('../resources/svg/IO_checksingle.json') as SvgFile}
								fillColor={MARKER_SENT_FILL}
								height={17}
								width={17}
								style={{ alignSelf: 'flex-end' }}
							/>
						</RX.View>
					);
				} else if (this.props.readMarker.read === this.props.readMarker.total) {
					readMarker = (
						<RX.View style={styles.containerMarker}>
							<IconSvg
								source={require('../resources/svg/IO_checkdouble.json') as SvgFile}
								fillColor={MARKER_READ_FILL}
								height={17}
								width={17}
								style={{ alignSelf: 'flex-end' }}
							/>
						</RX.View>
					);
				} else if (this.props.readMarker.read > 0) {
					readMarker = (
						<RX.View style={styles.containerMarker}>
							<IconSvg
								source={require('../resources/svg/IO_checksingle.json') as SvgFile}
								fillColor={MARKER_READ_FILL}
								height={17}
								width={17}
								style={{ alignSelf: 'flex-end' }}
							/>
							<RX.Text style={styles.markerText}>{this.props.readMarker?.read}</RX.Text>
						</RX.View>
					);
				}
			} else if (this.props.readMarker?.read === -1) {
				readMarker = (
					<RX.View style={styles.containerMarker}>
						<RX.View style={styles.spinner}>
							<Spinner
								size={'small'}
								color={MARKER_SENT_FILL}
								isVisible={true}
							/>
						</RX.View>
					</RX.View>
				);
			}
		}

		let cornerPointer: ReactElement | undefined;

		if (['direct', 'group'].includes(this.props.roomType)) {
			const cornerWidth = 18;
			const cornerHeight = (cornerWidth * 71.49) / 100;
			cornerPointer = (
				<RX.View
					style={[
						styles.containerCorner,
						{
							left: isOwnMessage ? -cornerWidth / 2 : undefined,
							right: isOwnMessage ? undefined : -cornerWidth / 2,
							width: cornerWidth / 2,
						},
					]}
				>
					<IconSvg
						style={{
							position: 'absolute',
							bottom: 0,
							left: isOwnMessage ? 0 : undefined,
							right: isOwnMessage ? undefined : 0,
						}}
						source={require('../resources/svg/corner.json') as SvgFile}
						fillColor={isOwnMessage ? TILE_BACKGROUND_OWN : TILE_BACKGROUND}
						height={cornerHeight}
						width={cornerWidth}
					/>
				</RX.View>
			);
		}

		let messageWrapper;

		if (UiStore.getPlatform() === 'web' && UiStore.getDevice() === 'mobile') {
			messageWrapper = (
				<RX.GestureView
					style={[styles.containerTile, this.tileStyle]}
					onLongPress={this.showContextDialog}
					onPan={() => null}
				>
					{cornerPointer}
					<RX.View style={styles.containerMessage}>
						{replyMessage}
						{message}
					</RX.View>
					<RX.View
						style={[styles.containerFooter, { height: this.props.withSenderDetails ? undefined : 16 }]}
					>
						{footer}
						{readMarker}
					</RX.View>
				</RX.GestureView>
			);
		} else {
			messageWrapper = (
				<RX.View
					style={[styles.containerTile, this.tileStyle]}
					onPress={() => RX.UserInterface.dismissKeyboard()}
					onLongPress={this.showContextDialog}
					disableTouchOpacityAnimation={true}
					onContextMenu={this.showContextDialog}
					activeOpacity={1}
					onLayout={() => null}
				>
					{cornerPointer}
					<RX.View style={styles.containerMessage}>
						{replyMessage}
						{message}
					</RX.View>
					<RX.View
						style={[styles.containerFooter, { height: this.props.withSenderDetails ? undefined : 16 }]}
					>
						{footer}
						{readMarker}
					</RX.View>
				</RX.View>
			);
		}

		return (
			<RX.View
				style={styles.container}
				onPress={() => RX.UserInterface.dismissKeyboard()}
				ref={component => (this.mainTile = component!)}
			>
				{messageWrapper}
			</RX.View>
		);
	}
}
