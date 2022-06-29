import React, { ReactElement } from 'react';
import RX from 'reactxp';
import {
	TILE_BACKGROUND,
	FOOTER_TEXT,
	BORDER_RADIUS,
	SPACING,
	FONT_NORMAL,
	TILE_SYSTEM_TEXT,
	BUTTON_ROUND_WIDTH,
	TRANSPARENT_BACKGROUND,
	MARKER_READ_FILL,
	MARKER_SENT_FILL,
	TILE_BACKGROUND_OWN,
	PAGE_MARGIN,
	APP_BACKGROUND,
} from '../ui';
import ImageMessage from './ImageMessage';
import FileMessage from './FileMessage';
import TextMessage from './TextMessage';
import ApiClient from '../matrix/ApiClient';
import { MessageEvent } from '../models/MessageEvent';
import DialogMessageTile from '../dialogs/DialogMessageTile';
import { encryptedMessage, messageDeleted } from '../translations';
import UiStore from '../stores/UiStore';
import IconSvg, { SvgFile } from './IconSvg';
import { format } from 'date-fns';
import { RoomType } from '../models/MatrixApi';
import Spinner from './Spinner';
import AppFont from '../modules/AppFont';
import VideoMessage from './VideoMessage';
import DataStore from '../stores/DataStore';
import ReplyMessage from './ReplyMessage';
import Shadow from '../modules/Shadow';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		overflow: 'visible',
		backgroundColor: TRANSPARENT_BACKGROUND,
	}),
	containerTile: RX.Styles.createViewStyle({
		borderRadius: BORDER_RADIUS,
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
	}),
	footerDetails: RX.Styles.createViewStyle({
		flex: 1,
		flexDirection: 'column',
	}),
	footerSenderId: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		flexShrink: 1,
		fontSize: FONT_NORMAL,
		color: FOOTER_TEXT,
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
		backgroundColor: APP_BACKGROUND,
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
	event: MessageEvent;
	roomType: RoomType;
	readMarkerType?: string;
	replyMessage?: MessageEvent;
	setReplyMessage: (message: MessageEvent) => void;
	onPressReply?: (eventId: string) => void;
	showTempForwardedMessage?: (roomId: string, message?: MessageEvent, tempId?: string) => void;
	canPress?: boolean;
	isRedacted: boolean;
	withSenderDetails?: boolean | undefined;
}

export default class MessageTile extends RX.Component<MessageTileProps, RX.Stateless> {
	private mainTile: RX.View | undefined;
	private tileStyle: RX.Types.ViewStyleRuleSet;

	public shouldComponentUpdate(nextProps: MessageTileProps): boolean {
		return (
			this.props.readMarkerType !== nextProps.readMarkerType ||
			this.props.isRedacted !== nextProps.isRedacted ||
			this.props.withSenderDetails !== nextProps.withSenderDetails
		);
	}

	private showContextDialog = () => {
		RX.UserInterface.dismissKeyboard();

		RX.UserInterface.measureLayoutRelativeToWindow(this.mainTile!)
			.then(layout => {
				const dialogMessageTile = (
					<DialogMessageTile
						roomId={this.props.roomId}
						event={this.props.event}
						layout={layout}
						roomType={this.props.roomType}
						readMarkerType={this.props.readMarkerType}
						replyMessage={this.props.replyMessage}
						setReplyMessage={this.props.setReplyMessage}
						showTempForwardedMessage={this.props.showTempForwardedMessage}
						marginStyle={this.tileStyle}
					/>
				);

				RX.Modal.show(dialogMessageTile, 'dialogMessageTile');
			})
			.catch(_error => null);
	};

	public render(): JSX.Element | null {
		let message;
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

		if (this.props.isRedacted) {
			messageType = 'system';

			message = <RX.Text style={styles.containerText}>{messageDeleted[UiStore.getLanguage()]}</RX.Text>;
		} else if (this.props.event.type === 'm.room.encrypted') {
			messageType = 'system';

			message = <RX.Text style={styles.containerText}>{encryptedMessage[UiStore.getLanguage()]}</RX.Text>;
		} else if (this.props.event.content.msgtype === 'm.image') {
			messageType = 'media';

			message = (
				<ImageMessage
					roomId={this.props.roomId}
					message={this.props.event}
					showContextDialog={this.showContextDialog}
				/>
			);
		} else if (this.props.event.content.msgtype === 'm.video') {
			messageType = 'media';

			message = (
				<VideoMessage
					message={this.props.event}
					showContextDialog={this.showContextDialog}
				/>
			);
		} else if (this.props.event.content.msgtype === 'm.file') {
			messageType = 'file';

			message = (
				<FileMessage
					message={this.props.event}
					showContextDialog={this.showContextDialog}
				/>
			);
		} else {
			messageType = 'text';

			message = (
				<TextMessage
					roomId={this.props.roomId}
					message={this.props.event}
					showContextDialog={this.showContextDialog}
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
			(borderBottomLeftRadius = isOwnMessage ? 0 : BORDER_RADIUS),
				(borderBottomRightRadius = isOwnMessage ? BORDER_RADIUS : 0);
		} else {
			borderBottomLeftRadius = BORDER_RADIUS;
			borderBottomRightRadius = BORDER_RADIUS;
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
			if (this.props.readMarkerType === 'read' && this.props.roomType !== 'notepad') {
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
			} else if (this.props.readMarkerType === 'sent' && this.props.roomType !== 'notepad') {
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
			} else if (this.props.readMarkerType === 'sending') {
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
