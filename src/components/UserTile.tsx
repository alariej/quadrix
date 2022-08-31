import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { User } from '../models/User';
import DataStore from '../stores/DataStore';
import ApiClient from '../matrix/ApiClient';
import {
	TILE_BACKGROUND,
	BUTTON_LONG_TEXT,
	TILE_SYSTEM_TEXT,
	BORDER_RADIUS,
	SPACING,
	FONT_NORMAL,
	FONT_LARGE,
	FONT_SMALL,
	TILE_HEIGHT,
	AVATAR_TILE_WIDTH,
	LIGHT_BACKGROUND,
	TILE_MESSAGE_TEXT,
	AVATAR_FOREGROUND,
	ICON_REDUCTION_FACTOR,
} from '../ui';
import UiStore from '../stores/UiStore';
import { invited, left, admin, inactive } from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import AppFont from '../modules/AppFont';
import CachedImage from '../modules/CachedImage';
import StringUtils from '../utils/StringUtils';
import UserPresence from './UserPresence';
import DialogUserTile from '../dialogs/DialogUserTile';
import { RoomType } from '../models/MatrixApi';

const styles = {
	container: RX.Styles.createViewStyle({
		flexDirection: 'row',
		height: TILE_HEIGHT,
		marginBottom: 1,
		borderRadius: BORDER_RADIUS,
		backgroundColor: TILE_BACKGROUND,
		alignItems: 'center',
		padding: 2 * SPACING,
		overflow: 'visible',
	}),
	containerAvatar: RX.Styles.createViewStyle({
		justifyContent: 'center',
		alignItems: 'center',
		width: AVATAR_TILE_WIDTH,
		height: AVATAR_TILE_WIDTH,
	}),
	avatar: RX.Styles.createImageStyle({
		flex: 1,
		width: AVATAR_TILE_WIDTH,
		height: AVATAR_TILE_WIDTH,
		borderRadius: AVATAR_TILE_WIDTH / 2,
	}),
	containerUserInfo: RX.Styles.createViewStyle({
		flex: 1,
		flexDirection: 'column',
		paddingLeft: 2 * SPACING,
	}),
	containerRoomName: RX.Styles.createTextStyle({
		alignItems: 'center',
	}),
	userName: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		fontWeight: 'bold',
		color: TILE_MESSAGE_TEXT,
	}),
	containerUserId: RX.Styles.createViewStyle({
		// not used
	}),
	userId: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: TILE_SYSTEM_TEXT,
	}),
	containerStatus: RX.Styles.createViewStyle({
		position: 'absolute',
		backgroundColor: LIGHT_BACKGROUND,
		bottom: 0,
		width: AVATAR_TILE_WIDTH,
		borderRadius: 3,
	}),
	status: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_SMALL,
		color: BUTTON_LONG_TEXT,
		textAlign: 'center',
	}),
};

interface UserTileProps {
	user: User;
	inviteUser?: (userId: string) => void;
	canPress?: boolean;
	hideMembership?: boolean;
	roomId?: string;
	roomType?: RoomType;
	showRoom?: (roomID: string) => void;
}

export default class UserTile extends RX.Component<UserTileProps, RX.Stateless> {
	private mainTile: RX.View | undefined;

	private onTileClick = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		if (this.props.inviteUser) {
			this.props.inviteUser(this.props.user.id);
		}
	};

	private showContextDialog = () => {
		if (this.props.canPress) {
			return;
		}

		RX.UserInterface.measureLayoutRelativeToWindow(this.mainTile!)
			.then(layout => {
				const dialogUserTile = (
					<DialogUserTile
						user={this.props.user}
						roomId={this.props.roomId!}
						roomType={this.props.roomType!}
						layout={layout}
						showRoom={this.props.showRoom}
					/>
				);

				RX.Modal.show(dialogUserTile, 'dialog_user_tile');
			})
			.catch(_error => null);
	};

	public render(): JSX.Element | null {
		const avatarUrl = StringUtils.mxcToHttp(this.props.user.avatarUrl!, ApiClient.credentials.homeServer);

		const avatarIsUrl = avatarUrl && avatarUrl.includes('https');

		const roomType = DataStore.getRoomType(this.props.roomId!);

		let avatar: ReactElement;
		if (!avatarIsUrl) {
			avatar = (
				<IconSvg
					source={require('../resources/svg/RI_user.json') as SvgFile}
					fillColor={AVATAR_FOREGROUND}
					height={AVATAR_TILE_WIDTH / ICON_REDUCTION_FACTOR}
					width={AVATAR_TILE_WIDTH / ICON_REDUCTION_FACTOR}
				/>
			);
		} else {
			avatar = (
				<CachedImage
					resizeMode={'cover'}
					style={styles.avatar}
					source={avatarUrl}
				/>
			);
		}

		let status: ReactElement;
		if (!this.props.hideMembership) {
			if (this.props.user.membership === 'invite') {
				status = (
					<RX.View style={styles.containerStatus}>
						<RX.Text
							allowFontScaling={false}
							numberOfLines={1}
							style={styles.status}
						>
							{invited[UiStore.getLanguage()]}
						</RX.Text>
					</RX.View>
				);
			} else if (this.props.user.membership === 'leave') {
				status = (
					<RX.View style={styles.containerStatus}>
						<RX.Text
							allowFontScaling={false}
							numberOfLines={1}
							style={styles.status}
						>
							{left[UiStore.getLanguage()]}
						</RX.Text>
					</RX.View>
				);
			} else if (
				this.props.roomId &&
				!['community', 'notepad'].includes(roomType!) &&
				!DataStore.userIsActive(this.props.roomId, this.props.user.id)
			) {
				status = (
					<RX.View style={styles.containerStatus}>
						<RX.Text
							allowFontScaling={false}
							numberOfLines={1}
							style={styles.status}
						>
							{inactive[UiStore.getLanguage()]}
						</RX.Text>
					</RX.View>
				);
			} else if (this.props.user.powerLevel === 100 && !['direct', 'notepad'].includes(roomType!)) {
				status = (
					<RX.View style={styles.containerStatus}>
						<RX.Text
							allowFontScaling={false}
							numberOfLines={1}
							style={styles.status}
						>
							{admin[UiStore.getLanguage()]}
						</RX.Text>
					</RX.View>
				);
			}
		}

		let lastSeen: ReactElement | undefined;
		if (['direct', 'group'].includes(roomType!)) {
			lastSeen = (
				<RX.View style={styles.containerUserId}>
					<UserPresence
						userId={this.props.user.id}
						fontColor={TILE_SYSTEM_TEXT}
						fontSize={FONT_NORMAL}
					/>
				</RX.View>
			);
		}

		return (
			<RX.View
				style={[styles.container, { cursor: this.props.canPress ? 'pointer' : 'default' }]}
				onPress={event => this.onTileClick(event)}
				disableTouchOpacityAnimation={false}
				activeOpacity={0.8}
				onLongPress={this.showContextDialog}
				onContextMenu={this.showContextDialog}
				ref={component => (this.mainTile = component!)}
			>
				<RX.View style={styles.containerAvatar}>
					{avatar}
					{status!}
				</RX.View>
				<RX.View style={styles.containerUserInfo}>
					<RX.Text
						allowFontScaling={false}
						numberOfLines={1}
						style={[
							styles.containerRoomName,
							{ marginBottom: ['direct', 'group'].includes(roomType!) ? 0 : SPACING },
						]}
					>
						<RX.Text
							allowFontScaling={false}
							numberOfLines={1}
							style={styles.userName}
						>
							{this.props.user.name || this.props.user.id}
						</RX.Text>
					</RX.Text>
					<RX.View style={styles.containerUserId}>
						<RX.Text
							allowFontScaling={false}
							numberOfLines={1}
							style={styles.userId}
						>
							{this.props.user.id}
						</RX.Text>
					</RX.View>
					{lastSeen}
				</RX.View>
			</RX.View>
		);
	}
}
