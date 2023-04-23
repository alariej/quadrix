import React, { ReactElement } from 'react';
import RX from 'reactxp';
import {
	HEADER_TEXT,
	BORDER_RADIUS,
	HEADER_HEIGHT,
	SPACING,
	FONT_NORMAL,
	FONT_LARGE,
	AVATAR_HEADER_WIDTH,
	ICON_REDUCTION_FACTOR,
	BUTTON_UNREAD_TEXT,
	BUTTON_UNREAD_BACKGROUND,
	AVATAR_BACKGROUND,
	TRANSPARENT_BACKGROUND,
	HEADER_STATUS,
	AVATAR_FOREGROUND,
	BUTTON_HEADER_BACKGROUND,
	BUTTON_FILL_HEADER,
	APP_BACKGROUND,
} from '../ui';
import { ComponentBase } from 'resub';
import DataStore from '../stores/DataStore';
import { User } from '../models/User';
import ApiClient from '../matrix/ApiClient';
import DialogAvatar from '../dialogs/DialogAvatar';
import DialogRoomHeader from '../dialogs/DialogRoomHeader';
import UiStore from '../stores/UiStore';
import { RoomSummary } from '../models/RoomSummary';
import { communityMembers, notepad, Languages } from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import { StyleRuleSet, TextStyle } from 'reactxp/dist/common/Types';
import { RoomPhase, RoomType } from '../models/MatrixApi';
import Pushers from '../modules/Pushers';
import AppFont from '../modules/AppFont';
import UserPresence from './UserPresence';
import FileHandler from '../modules/FileHandler';
import CachedImage from '../modules/CachedImage';
import StringUtils from '../utils/StringUtils';
import AnimatedButton from './AnimatedButton';

const styles = {
	container: RX.Styles.createViewStyle({
		flexDirection: 'row',
		height: HEADER_HEIGHT,
		backgroundColor: APP_BACKGROUND,
	}),
	containerRoomHeader: RX.Styles.createViewStyle({
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		padding: SPACING,
		borderRadius: BORDER_RADIUS,
		cursor: 'pointer',
		backgroundColor: TRANSPARENT_BACKGROUND,
	}),
	containerAvatar: RX.Styles.createViewStyle({
		justifyContent: 'center',
		alignItems: 'center',
		width: AVATAR_HEADER_WIDTH,
		height: AVATAR_HEADER_WIDTH,
		borderRadius: AVATAR_HEADER_WIDTH / 2,
		cursor: 'pointer',
		backgroundColor: 'white',
	}),
	avatar: RX.Styles.createImageStyle({
		flex: 1,
		width: AVATAR_HEADER_WIDTH,
		borderRadius: AVATAR_HEADER_WIDTH / 2,
		backgroundColor: AVATAR_BACKGROUND,
	}),
	containerRoomInfo: RX.Styles.createViewStyle({
		flex: 1,
		paddingLeft: 2 * SPACING,
	}),
	containerRoomName: RX.Styles.createTextStyle({
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		maxHeight: FONT_LARGE + 4,
		marginBottom: SPACING,
	}),
	roomName: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		color: HEADER_TEXT,
		fontWeight: 'bold',
	}),
	alias: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: HEADER_TEXT,
	}),
	containerSubtitle: RX.Styles.createViewStyle({
		flexDirection: 'row',
		alignItems: 'flex-end',
		maxHeight: FONT_NORMAL + 4,
	}),
	subtitle: RX.Styles.createTextStyle({
		flex: 1,
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: HEADER_STATUS,
	}),
	containerHomeButton: RX.Styles.createViewStyle({
		width: HEADER_HEIGHT / 2,
		height: HEADER_HEIGHT / 2,
		marginLeft: SPACING,
		overflow: 'visible',
	}),
	roundButton: RX.Styles.createViewStyle({
		width: HEADER_HEIGHT / 2,
		height: HEADER_HEIGHT / 2,
		borderRadius: HEADER_HEIGHT / 4,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: BUTTON_HEADER_BACKGROUND,
	}),
	unreadNumber: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		position: 'absolute',
		bottom: -12,
		right: 0,
		height: 18,
		width: 18,
		borderRadius: 9,
		backgroundColor: BUTTON_UNREAD_BACKGROUND,
		fontSize: 10,
		color: BUTTON_UNREAD_TEXT,
		textAlign: 'center',
	}),
};

interface RoomHeaderState {
	avatarUrl: string;
	name: string;
	type: RoomType;
	phase: RoomPhase;
	members: { [id: string]: User };
	contactId: string;
	totalUnreadCount: number;
}

interface RoomHeaderProps extends RX.CommonProps {
	showLogin: () => void;
	showRoomList: () => void;
	showRoom: (roomId: string) => void;
	roomId: string;
}

export default class RoomHeader extends ComponentBase<RoomHeaderProps, RoomHeaderState> {
	private alias = '';
	private joinMembersCount = 0;
	private roomSummary!: RoomSummary;
	private language: Languages = 'en';
	private unreadTextStyle: StyleRuleSet<TextStyle> = undefined;
	private messageCount: { [id: string]: number } = {};

	constructor(props: RoomHeaderProps) {
		super(props);

		this.language = UiStore.getLanguage();

		if (UiStore.getPlatform() !== 'android') {
			this.unreadTextStyle = RX.Styles.createTextStyle(
				{
					lineHeight: 18,
				},
				false
			);
		}
	}

	protected _buildState(nextProps: RoomHeaderProps, initState: boolean): Partial<RoomHeaderState> {
		const partialState: Partial<RoomHeaderState> = {};

		if (UiStore.getUnknownAccessToken()) {
			this.doLogout().catch(_error => null);
			return partialState;
		}

		this.roomSummary = DataStore.getRoomSummary(nextProps.roomId);

		this.alias = this.roomSummary.alias!;
		this.joinMembersCount = this.roomSummary.joinMembersCount!;

		if (this.roomSummary.type === 'group' && (initState || this.props.roomId !== nextProps.roomId)) {
			this.messageCount = {};
			for (const event of this.roomSummary.timelineEvents.slice(-100)) {
				this.messageCount[event.sender] = (this.messageCount[event.sender] || 0) + 1;
			}
		}

		let avatarUrl: string | undefined;
		let name: string | undefined;
		if (this.roomSummary.type === 'direct') {
			name = this.roomSummary.members[this.roomSummary.contactId!]?.name;
			avatarUrl = this.roomSummary.members[this.roomSummary.contactId!]?.avatarUrl;
		} else {
			name = this.roomSummary.name;
			avatarUrl = this.roomSummary.avatarUrl;
		}

		partialState.avatarUrl = StringUtils.mxcToHttp(avatarUrl!, ApiClient.credentials.homeServer);
		partialState.name = name;
		partialState.type = this.roomSummary.type;
		partialState.phase = this.roomSummary.phase;
		partialState.members = this.roomSummary.members;
		partialState.contactId = this.roomSummary.contactId;
		partialState.totalUnreadCount = DataStore.getUnreadTotal(nextProps.roomId);

		return partialState;
	}

	private doLogout = async () => {
		RX.Modal.dismissAll();

		Pushers.removeFromDevice(ApiClient.credentials).catch(_error => null);

		ApiClient.stopSync();
		ApiClient.clearNextSyncToken();
		FileHandler.clearCacheAppFolder();
		await ApiClient.clearStorage();
		await ApiClient.storeLastUserId();
		DataStore.clearRoomSummaryList();

		this.props.showLogin();
	};

	private onPressHomeButton = () => {
		RX.UserInterface.dismissKeyboard();

		this.props.showRoomList();
	};

	private onPressAvatar = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		RX.UserInterface.dismissKeyboard();

		RX.Modal.show(
			<DialogAvatar
				roomName={this.state.name}
				avatarUrl={this.state.avatarUrl}
				roomType={this.state.type}
				roomPhase={this.state.phase}
				roomId={this.props.roomId}
			/>,
			'avatardialog'
		);
	};

	private onPressHeader = () => {
		RX.UserInterface.dismissKeyboard();

		RX.Modal.show(
			<DialogRoomHeader
				roomId={this.props.roomId}
				roomType={this.state.type}
				roomPhase={this.state.phase}
				members={this.state.members}
				showRoomList={this.props.showRoomList}
				showRoom={this.props.showRoom}
			/>,
			'dialogroomheader'
		);
	};

	public render(): JSX.Element | null {
		const avatarIsUrl = this.state.avatarUrl && this.state.avatarUrl.includes('https');

		let avatar: ReactElement;
		if (!this.state.avatarUrl) {
			if (this.state.type === 'direct') {
				avatar = (
					<IconSvg
						source={require('../resources/svg/RI_user.json') as SvgFile}
						fillColor={AVATAR_FOREGROUND}
						height={AVATAR_HEADER_WIDTH / ICON_REDUCTION_FACTOR}
						width={AVATAR_HEADER_WIDTH / ICON_REDUCTION_FACTOR}
					/>
				);
			} else if (this.state.type === 'notepad') {
				avatar = (
					<IconSvg
						source={require('../resources/svg/RI_notepad.json') as SvgFile}
						fillColor={AVATAR_FOREGROUND}
						height={AVATAR_HEADER_WIDTH / ICON_REDUCTION_FACTOR}
						width={AVATAR_HEADER_WIDTH / ICON_REDUCTION_FACTOR}
					/>
				);
			} else if (this.state.type === 'group') {
				avatar = (
					<IconSvg
						source={require('../resources/svg/RI_users.json') as SvgFile}
						fillColor={AVATAR_FOREGROUND}
						height={AVATAR_HEADER_WIDTH / ICON_REDUCTION_FACTOR}
						width={AVATAR_HEADER_WIDTH / ICON_REDUCTION_FACTOR}
					/>
				);
			} else if (this.state.type === 'community') {
				avatar = (
					<IconSvg
						source={require('../resources/svg/RI_public.json') as SvgFile}
						fillColor={AVATAR_FOREGROUND}
						height={AVATAR_HEADER_WIDTH / ICON_REDUCTION_FACTOR}
						width={AVATAR_HEADER_WIDTH / ICON_REDUCTION_FACTOR}
					/>
				);
			}
		} else if (avatarIsUrl) {
			avatar = (
				<CachedImage
					resizeMode={'cover'}
					style={styles.avatar}
					source={this.state.avatarUrl}
				/>
			);
		}

		let alias: ReactElement | undefined = undefined;
		if (this.alias && this.state.type === 'community' && this.state.name !== this.alias) {
			alias = (
				<RX.Text
					style={styles.alias}
					allowFontScaling={false}
					numberOfLines={1}
				>
					{' ' + this.alias}
				</RX.Text>
			);
		} else if (this.state.type === 'direct' && this.state.name !== this.state.contactId) {
			alias = (
				<RX.Text
					style={styles.alias}
					allowFontScaling={false}
					numberOfLines={1}
				>
					{' ' + this.state.contactId}
				</RX.Text>
			);
		}

		let subtitle: ReactElement | ReactElement[] | undefined = undefined;

		if (this.state.type === 'direct') {
			subtitle = (
				<UserPresence
					userId={this.state.contactId}
					fontColor={HEADER_STATUS}
					fontSize={FONT_NORMAL}
				/>
			);
		} else if (this.state.type === 'community') {
			subtitle = (
				<RX.Text
					allowFontScaling={false}
					numberOfLines={1}
					style={styles.subtitle}
				>
					{communityMembers(this.joinMembersCount, this.language)}
				</RX.Text>
			);
		} else if (this.state.type === 'notepad') {
			subtitle = (
				<RX.Text
					allowFontScaling={false}
					numberOfLines={1}
					style={styles.subtitle}
				>
					{notepad[this.language]}
				</RX.Text>
			);
		} else if (this.state.members) {
			let userArray: User[] = [];

			if (this.state.members) {
				userArray = Object.values(this.state.members)
					.filter(member => member.membership && member.membership !== 'leave')
					.sort((a, b) => {
						const c = this.messageCount[a.id] || 0;
						const d = this.messageCount[b.id] || 0;
						return d - c;
					});
			}

			const memberRenderArray: Array<ReactElement> = [];

			for (const member of userArray) {
				const separator = memberRenderArray.length ? ', ' : '';
				let memberRender: ReactElement;
				if (member.membership === 'invite' || !DataStore.userIsActive(this.props.roomId, member.id)) {
					memberRender = (
						<RX.Text
							allowFontScaling={false}
							numberOfLines={1}
							key={member.id}
							style={{ fontStyle: 'italic' }}
						>
							{separator + (member.name || member.id)}
						</RX.Text>
					);
					memberRenderArray.push(memberRender);
				} else if (member.membership === 'join') {
					memberRender = (
						<RX.Text
							allowFontScaling={false}
							numberOfLines={1}
							key={member.id}
						>
							{separator + (member.name || member.id)}
						</RX.Text>
					);
					memberRenderArray.push(memberRender);
				}
			}

			subtitle = (
				<RX.Text
					allowFontScaling={false}
					numberOfLines={1}
					style={styles.subtitle}
				>
					{memberRenderArray}
				</RX.Text>
			);
		}

		let unread: ReactElement | undefined = undefined;
		if (this.state.totalUnreadCount !== undefined && this.state.totalUnreadCount > 0) {
			unread = (
				<RX.Text
					allowFontScaling={false}
					style={[styles.unreadNumber, this.unreadTextStyle]}
				>
					{this.state.totalUnreadCount > 9 ? '9+' : this.state.totalUnreadCount}
				</RX.Text>
			);
		}

		return (
			<RX.View style={styles.container}>
				<RX.View
					style={styles.containerRoomHeader}
					onPress={() => this.onPressHeader()}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					<RX.View
						style={styles.containerAvatar}
						onPress={event => this.onPressAvatar(event)}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					>
						{avatar!}
					</RX.View>
					<RX.View style={styles.containerRoomInfo}>
						<RX.Text
							style={styles.containerRoomName}
							allowFontScaling={false}
							numberOfLines={1}
						>
							<RX.Text
								style={styles.roomName}
								allowFontScaling={false}
								numberOfLines={1}
							>
								{this.state.name}
							</RX.Text>
							{alias}
						</RX.Text>
						<RX.View style={styles.containerSubtitle}>{subtitle}</RX.View>
					</RX.View>
				</RX.View>
				<RX.View style={styles.containerHomeButton}>
					<AnimatedButton
						buttonStyle={styles.roundButton}
						iconStyle={{ marginRight: 2 }}
						iconSource={require('../resources/svg/RI_arrowleft.json') as SvgFile}
						iconFillColor={BUTTON_FILL_HEADER}
						iconHeight={32}
						iconWidth={32}
						animatedColor={BUTTON_FILL_HEADER}
						onPress={this.onPressHomeButton}
					/>
					{unread}
				</RX.View>
			</RX.View>
		);
	}
}
