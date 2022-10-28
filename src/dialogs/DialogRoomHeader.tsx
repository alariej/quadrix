import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { User } from '../models/User';
import ApiClient from '../matrix/ApiClient';
import UserTile from '../components/UserTile';
import {
	VirtualListView,
	VirtualListViewCellRenderDetails,
	VirtualListViewItemInfo,
} from '../components/VirtualListView';
import DataStore from '../stores/DataStore';
import DialogContainer from '../modules/DialogContainer';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import {
	BUTTON_MODAL_BACKGROUND,
	BUTTON_MODAL_TEXT,
	MODAL_CONTENT_BACKGROUND,
	OPAQUE_BACKGROUND,
	BORDER_RADIUS,
	TILE_WIDTH,
	BUTTON_LONG_WIDTH,
	BUTTON_HEIGHT,
	SPACING,
	FONT_LARGE,
	FONT_NORMAL,
	TILE_HEIGHT,
	OBJECT_MARGIN,
	OPAQUE_DUMMY_BACKGROUND,
	ICON_INFO_SIZE,
	ICON_INFO_FILL,
	BUTTON_WARNING_TEXT,
} from '../ui';
import {
	theInvitationWasSent,
	theInvitationNotSent,
	cancel,
	pressOKToInvite,
	toThisGroup,
	pressOKToLeaveRoom,
	inviteAdditionalUser,
	leaveRoom,
	youDoNotHavePrivateContacts,
	youHaveLeftRoom1,
	youHaveLeftRoom2,
	Languages,
} from '../translations';
import { ErrorResponse_, RoomPhase, RoomType } from '../models/MatrixApi';
import SpinnerUtils from '../utils/SpinnerUtils';
import Spinner from '../components/Spinner';
import AppFont from '../modules/AppFont';
import IconSvg, { SvgFile } from '../components/IconSvg';

const styles = {
	modalScreen: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		backgroundColor: OPAQUE_BACKGROUND,
		justifyContent: 'center',
	}),
	modalView: RX.Styles.createViewStyle({
		alignSelf: 'center',
		justifyContent: 'center',
		width: TILE_WIDTH,
		minHeight: TILE_HEIGHT + 1,
		maxHeight: 360, // TODO: make this dynamic
	}),
	button: RX.Styles.createViewStyle({
		borderRadius: BUTTON_HEIGHT / 2,
		width: BUTTON_LONG_WIDTH,
		height: BUTTON_HEIGHT,
		backgroundColor: BUTTON_MODAL_BACKGROUND,
		marginTop: OBJECT_MARGIN,
	}),
	topic: RX.Styles.createViewStyle({
		flex: 1,
		borderRadius: BORDER_RADIUS,
		maxHeight: TILE_HEIGHT * 1.5,
		width: TILE_WIDTH,
		backgroundColor: MODAL_CONTENT_BACKGROUND,
		marginBottom: OBJECT_MARGIN,
		padding: SPACING,
		alignSelf: 'center',
	}),
	aliasText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		fontWeight: 'bold',
	}),
	topicScrollView: RX.Styles.createViewStyle({
		flex: 1,
	}),
	topicText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		flex: 1,
		fontSize: FONT_NORMAL,
	}),
	buttonText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		marginVertical: SPACING,
		textAlign: 'center',
	}),
	containerButtons: RX.Styles.createViewStyle({
		alignItems: 'center',
	}),
	textDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		color: BUTTON_MODAL_TEXT,
		fontSize: FONT_LARGE,
		margin: 12,
	}),
	spinnerContainer: RX.Styles.createViewStyle({
		position: 'absolute',
		height: TILE_WIDTH,
		width: TILE_WIDTH,
		justifyContent: 'center',
		alignItems: 'center',
	}),
	containerWrapper: RX.Styles.createViewStyle({
		backgroundColor: OPAQUE_DUMMY_BACKGROUND,
	}),
};

interface DialogRoomHeaderProps extends RX.CommonProps {
	roomId: string;
	roomType: RoomType;
	roomPhase: RoomPhase;
	members: { [id: string]: User };
	showRoomList: () => void;
	showRoom: (roomID: string) => void;
}

const animatedDuration = 200;
const animatedEasing = RX.Animated.Easing.Out();

interface DialogRoomHeaderState {
	userListItems: UserListItemInfo[];
	showSpinner: boolean;
	offline: boolean;
}

interface UserListItemInfo extends VirtualListViewItemInfo {
	member: User;
}

export default class DialogRoomHeader extends ComponentBase<DialogRoomHeaderProps, DialogRoomHeaderState> {
	private inviteUserId = '';
	private topic: string;
	private alias: string;
	private powerLevel: number;
	private language: Languages = 'en';
	private animatedOpacity: RX.Animated.Value;
	private animatedStyleOpacity: RX.Types.AnimatedViewStyleRuleSet;

	constructor(props: DialogRoomHeaderProps) {
		super(props);

		this.topic = DataStore.getTopic(props.roomId)!;
		this.alias = DataStore.getAlias(props.roomId)!;
		this.powerLevel = DataStore.getPowerLevel(props.roomId, ApiClient.credentials.userIdFull);
		this.language = UiStore.getLanguage();

		this.animatedOpacity = RX.Animated.createValue(0);
		this.animatedStyleOpacity = RX.Styles.createAnimatedViewStyle({
			opacity: this.animatedOpacity,
		});
	}

	protected _buildState(
		nextProps: DialogRoomHeaderProps,
		initState: boolean,
		_prevState: DialogRoomHeaderState
	): Partial<DialogRoomHeaderState> {
		const partialState: Partial<DialogRoomHeaderState> = {};

		if (initState) {
			partialState.userListItems = this.getUserListItems(nextProps.members);

			if (nextProps.roomType === 'community') {
				partialState.showSpinner = true;
				this.getRoomMembersFromServer(nextProps.roomId);
			} else {
				partialState.showSpinner = false;
			}
		}

		partialState.offline = UiStore.getOffline();

		return partialState;
	}

	public componentDidMount(): void {
		super.componentDidMount();

		RX.Animated.timing(this.animatedOpacity, {
			duration: animatedDuration,
			toValue: 1,
			easing: animatedEasing,
			useNativeDriver: true,
		}).start();
	}

	private getUserListItems = (members: { [id: string]: User }) => {
		const userListItems = Object.values(members)
			.filter(member => member.id !== 'unknown' && member.membership && member.membership !== 'leave')
			.sort((a, b) => (b.powerLevel || 0) - (a.powerLevel || 0))
			.map(member => {
				return {
					key: member.id,
					height: TILE_HEIGHT + 1,
					template: 'member',
					member: member,
					measureHeight: false,
				};
			});

		return userListItems;
	};

	private getRoomMembersFromServer = (roomId: string) => {
		ApiClient.getRoomMembers(roomId, true)
			.then(members => {
				const members_: { [id: string]: User } = {};
				Object.values(this.props.members).map(member => {
					members_[member.id] = { ...member, ...members[member.id] };
				});

				const userListItems = this.getUserListItems({ ...members, ...members_ });

				this.setState({
					userListItems: userListItems,
					showSpinner: false,
				});
			})
			.catch(_error => {
				this.setState({ showSpinner: false });
			});
	};

	private sendInvitation = () => {
		RX.Modal.dismiss('inviteconfirmation');

		SpinnerUtils.showModalSpinner('sendinvitespinner');

		ApiClient.inviteToRoom(this.props.roomId, this.inviteUserId)
			.then(_response => {
				RX.Modal.dismiss('sendinvitespinner');

				const text = <RX.Text style={styles.textDialog}>{theInvitationWasSent[this.language]}</RX.Text>;

				RX.Modal.show(<DialogContainer content={text} />, 'modaldialog');
			})
			.catch(_error => {
				RX.Modal.dismiss('sendinvitespinner');

				const text = <RX.Text style={styles.textDialog}>{theInvitationNotSent[this.language]}</RX.Text>;

				RX.Modal.show(
					<DialogContainer
						content={text}
						modalId={'errordialog'}
					/>,
					'errordialog'
				);
			});
	};

	private inviteUser = (userId: string) => {
		this.inviteUserId = userId;

		RX.Modal.dismiss('userlist');

		const text = (
			<RX.Text style={styles.textDialog}>
				<RX.Text>{pressOKToInvite[this.language]}</RX.Text>
				<RX.Text style={{ fontWeight: 'bold' }}>{' ' + userId + ' '}</RX.Text>
				<RX.Text>{toThisGroup[this.language]}</RX.Text>
			</RX.Text>
		);

		const inviteConfirmation = (
			<DialogContainer
				content={text}
				confirmButton={true}
				confirmButtonText={'OK'}
				cancelButton={true}
				cancelButtonText={cancel[this.language]}
				onConfirm={this.sendInvitation}
				onCancel={() => RX.Modal.dismissAll()}
			/>
		);

		RX.Modal.show(inviteConfirmation, 'inviteconfirmation');
	};

	private onPressLeaveRoom = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		const text = (
			<RX.Text style={styles.textDialog}>
				{pressOKToLeaveRoom[this.language + '_' + this.props.roomType.substr(0, 2)]}
			</RX.Text>
		);

		const leaveRoomConfirmation = (
			<DialogContainer
				content={text}
				confirmButton={true}
				confirmButtonText={'OK'}
				cancelButton={true}
				cancelButtonText={cancel[this.language]}
				onConfirm={this.leaveRoom}
				onCancel={() => RX.Modal.dismissAll()}
			/>
		);

		RX.Modal.show(leaveRoomConfirmation, 'leaveRoomConfirmation');
	};

	private leaveRoom = () => {
		// TODO: notepad
		// when the API endpoint is finally available
		// leave and delete notepad room from server
		// https://github.com/matrix-org/matrix-doc/issues/1882

		RX.Modal.dismissAll();

		const roomName = DataStore.getRoomName(this.props.roomId);

		DataStore.removeRoom(this.props.roomId);

		this.props.showRoomList();

		ApiClient.leaveRoom(this.props.roomId)
			.then(_response => {
				RX.Modal.dismissAll();

				const text = (
					<RX.Text style={styles.textDialog}>
						<RX.Text>{youHaveLeftRoom1[this.language + '_' + this.props.roomType.substr(0, 2)]}</RX.Text>
						<RX.Text style={{ fontWeight: 'bold' }}>{roomName}</RX.Text>
						<RX.Text>{youHaveLeftRoom2[this.language + '_' + this.props.roomType.substr(0, 2)]}</RX.Text>
					</RX.Text>
				);

				RX.Modal.show(
					<DialogContainer
						content={text}
						modalId={'successdialog'}
					/>,
					'successdialog'
				);
			})
			.catch((error: ErrorResponse_) => {
				RX.Modal.dismissAll();

				const text = (
					<RX.Text style={styles.textDialog}>
						{error.body && error.body.error ? error.body.error : '[Unknown error]'}
					</RX.Text>
				);

				RX.Modal.show(
					<DialogContainer
						content={text}
						modalId={'errordialog'}
					/>,
					'errordialog'
				);
			});
	};

	private onPressAddButton = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		RX.Modal.dismiss('memberlist');

		const users = DataStore.getUsers();

		if (users.length > 0) {
			const userTiles = users
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((user: User) => {
					return (
						<UserTile
							key={user.id}
							user={user}
							inviteUser={() => this.inviteUser(user.id)}
							canPress={true}
							hideMembership={true}
						/>
					);
				});

			const userList = (
				<RX.View
					style={styles.modalScreen}
					onPress={() => RX.Modal.dismissAll()}
					disableTouchOpacityAnimation={true}
				>
					<RX.View
						style={[styles.modalView, { height: userTiles.length * (TILE_HEIGHT + 1) }]}
						onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					>
						<RX.ScrollView
							style={{ width: UiStore.getPlatform() === 'web' ? TILE_WIDTH + 30 : TILE_WIDTH }}
						>
							{userTiles}
						</RX.ScrollView>
					</RX.View>
				</RX.View>
			);

			RX.Modal.show(userList, 'userlist');
		} else {
			const text = <RX.Text style={styles.textDialog}>{youDoNotHavePrivateContacts[this.language]}</RX.Text>;

			RX.Modal.show(<DialogContainer content={text} />, 'modaldialog');
		}
	};

	private renderItem = (cellRender: VirtualListViewCellRenderDetails<UserListItemInfo>) => {
		const userWrapper = (
			<RX.View
				style={styles.containerWrapper}
				onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
				disableTouchOpacityAnimation={true}
				activeOpacity={1}
			>
				<UserTile
					key={cellRender.item.member.id}
					user={cellRender.item.member}
					hideMembership={false}
					roomId={this.props.roomId}
					roomType={this.props.roomType}
					showRoom={this.props.showRoom}
				/>
			</RX.View>
		);

		return userWrapper;
	};

	public render(): JSX.Element | null {
		let leaveRoomButton: ReactElement | undefined;
		if (this.props.roomPhase === 'join') {
			leaveRoomButton = (
				<RX.Button
					style={styles.button}
					onPress={event => this.onPressLeaveRoom(event)}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
					disabled={this.state.offline}
					disabledOpacity={1}
				>
					<RX.Text
						allowFontScaling={false}
						style={[
							styles.buttonText,
							{ color: BUTTON_WARNING_TEXT, opacity: this.state.offline ? 0.3 : 1 },
						]}
					>
						{leaveRoom[this.language + '_' + this.props.roomType.substr(0, 2)]}
					</RX.Text>
					<IconSvg
						source={require('../resources/svg/RI_msg_delete.json') as SvgFile}
						style={{ position: 'absolute', right: 8, opacity: this.state.offline ? 0.3 : 1 }}
						fillColor={BUTTON_WARNING_TEXT}
						height={ICON_INFO_SIZE}
						width={ICON_INFO_SIZE}
					/>
				</RX.Button>
			);
		}

		let addUserButton: ReactElement | undefined;
		if (this.props.roomType === 'group' && this.props.roomPhase === 'join') {
			addUserButton = (
				<RX.Button
					style={styles.button}
					onPress={event => this.onPressAddButton(event)}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
					disabled={this.state.offline || this.powerLevel !== 100}
					disabledOpacity={1}
				>
					<RX.Text
						style={[
							styles.buttonText,
							{
								color: BUTTON_MODAL_TEXT,
								opacity: this.state.offline || this.powerLevel !== 100 ? 0.3 : 1,
							},
						]}
					>
						{inviteAdditionalUser[this.language]}
					</RX.Text>
					<IconSvg
						source={require('../resources/svg/RI_useradd.json') as SvgFile}
						style={{
							position: 'absolute',
							right: 8,
							opacity: this.state.offline || this.powerLevel !== 100 ? 0.3 : 1,
						}}
						fillColor={ICON_INFO_FILL}
						height={ICON_INFO_SIZE}
						width={ICON_INFO_SIZE}
					/>
				</RX.Button>
			);
		}

		let topicTile: ReactElement | undefined;
		if (this.props.roomType === 'community' && this.topic) {
			topicTile = (
				<RX.View
					style={styles.topic}
					onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					<RX.Text
						numberOfLines={1}
						style={styles.aliasText}
					>
						{this.alias}
					</RX.Text>
					<RX.ScrollView style={styles.topicScrollView}>
						<RX.Text
							style={styles.topicText}
							onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
						>
							{this.topic}
						</RX.Text>
					</RX.ScrollView>
				</RX.View>
			);
		}

		const spinner = (
			<RX.View
				style={styles.spinnerContainer}
				blockPointerEvents={!this.state.showSpinner}
			>
				<Spinner isVisible={this.state.showSpinner} />
			</RX.View>
		);

		return (
			<RX.Animated.View
				style={[styles.modalScreen, this.animatedStyleOpacity]}
				onPress={() => RX.Modal.dismissAll()}
				disableTouchOpacityAnimation={true}
			>
				{topicTile}
				<RX.View
					style={[styles.modalView, { height: this.state.userListItems.length * (TILE_HEIGHT + 1) }]}
					onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					<VirtualListView
						itemList={this.state.userListItems}
						renderItem={this.renderItem}
						skipRenderIfItemUnchanged={true}
						animateChanges={true}
					/>
					{spinner}
				</RX.View>
				<RX.View style={styles.containerButtons}>
					{addUserButton}
					{leaveRoomButton}
				</RX.View>
			</RX.Animated.View>
		);
	}
}
