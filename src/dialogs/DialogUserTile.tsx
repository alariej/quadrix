import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import {
	OPAQUE_BACKGROUND,
	BUTTON_MODAL_BACKGROUND,
	BUTTON_MODAL_TEXT,
	BORDER_RADIUS,
	STACKED_BUTTON_HEIGHT,
	FONT_LARGE,
	SPACING,
	TRANSPARENT_BACKGROUND,
	OPAQUE_LIGHT_BACKGROUND,
	ICON_INFO_SIZE,
	ICON_INFO_FILL,
	BUTTON_WIDTH,
	OBJECT_MARGIN,
	BUTTON_WARNING_TEXT,
} from '../ui';
import { LayoutInfo } from 'reactxp/dist/common/Types';
import DataStore from '../stores/DataStore';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import {
	Languages,
	cancel,
	removeUser,
	startChat,
	doYouReallyWantToRemove1,
	doYouReallyWantToRemove2,
	doYouReallyWantToRemove3,
	memberWasRemoved,
	pressOKToStartDM1,
	pressOKToStartDM2,
	errorNoConfirm,
	theUserId,
	doesntSeemToExist,
} from '../translations';
import Spinner from '../components/Spinner';
import AppFont from '../modules/AppFont';
import IconSvg, { SvgFile } from '../components/IconSvg';
import UserTile from '../components/UserTile';
import { User } from '../models/User';
import { ErrorResponse_, RoomType } from '../models/MatrixApi';
import SpinnerUtils from '../utils/SpinnerUtils';

const styles = {
	modalScreen: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		backgroundColor: OPAQUE_BACKGROUND,
	}),
	modalMessage: RX.Styles.createViewStyle({
		position: 'absolute',
		overflow: 'visible',
	}),
	buttonContainer: RX.Styles.createViewStyle({
		position: 'absolute',
		flexDirection: 'column',
		overflow: 'visible',
	}),
	buttonDialog: RX.Styles.createViewStyle({
		flexDirection: 'row',
		alignItems: 'center',
		padding: SPACING,
		borderRadius: BORDER_RADIUS,
		width: BUTTON_WIDTH,
		height: STACKED_BUTTON_HEIGHT,
		backgroundColor: BUTTON_MODAL_BACKGROUND,
		marginBottom: 1,
		shadowOffset: { width: -1, height: 1 },
		shadowColor: OPAQUE_LIGHT_BACKGROUND,
		shadowRadius: 3,
		elevation: 3,
		shadowOpacity: 1,
		overflow: 'visible',
	}),
	buttonText: RX.Styles.createTextStyle({
		flex: 1,
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		margin: SPACING,
		textAlign: 'left',
		color: BUTTON_MODAL_TEXT,
	}),
	boldText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontWeight: 'bold',
	}),
	textDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		color: BUTTON_MODAL_TEXT,
		fontSize: FONT_LARGE,
		margin: 12,
	}),
	saveDialog: RX.Styles.createTextStyle({
		flex: 1,
		flexDirection: 'column',
		margin: 12,
	}),
	saveDialogText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		color: BUTTON_MODAL_TEXT,
		fontSize: FONT_LARGE,
	}),
	modalMessageCover: RX.Styles.createViewStyle({
		position: 'absolute',
		borderRadius: BORDER_RADIUS,
		backgroundColor: TRANSPARENT_BACKGROUND,
	}),
	spinnerContainer: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		justifyContent: 'center',
		alignItems: 'center',
	}),
};

const animatedSizeStart = 0.2;
const animatedDuration = 500;
const animatedEasing = RX.Animated.Easing.InOutBack();

interface DialogUserTileProps extends RX.CommonProps {
	user: User;
	roomId: string;
	roomType: RoomType;
	layout: LayoutInfo;
	showRoom?: (roomID: string) => void;
}

interface DialogUserTileState {
	offline: boolean;
	showSpinner: boolean;
	showConfirmationDialog: boolean;
}

export default class DialogUserTile extends ComponentBase<DialogUserTileProps, DialogUserTileState> {
	private language: Languages = 'en';
	private animatedValue: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
	private confirmationDialog: ReactElement | undefined;
	private powerLevel: number;
	private groupName: string;

	constructor(props: DialogUserTileProps) {
		super(props);

		this.language = UiStore.getLanguage();
		this.powerLevel = DataStore.getPowerLevel(props.roomId, ApiClient.credentials.userIdFull);
		this.groupName = DataStore.getRoomName(props.roomId)!;

		this.animatedValue = RX.Animated.createValue(animatedSizeStart);
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			transform: [{ scale: this.animatedValue }],
		});
	}

	protected _buildState(
		_nextProps: DialogUserTileProps,
		initState: boolean,
		_prevState: DialogUserTileState
	): Partial<DialogUserTileState> {
		const partialState: Partial<DialogUserTileState> = {};

		if (initState) {
			partialState.showConfirmationDialog = false;
			partialState.showSpinner = false;
		}

		partialState.offline = UiStore.getOffline();

		return partialState;
	}

	public componentDidMount(): void {
		super.componentDidMount();

		RX.Animated.timing(this.animatedValue, {
			duration: animatedDuration,
			toValue: 1,
			easing: animatedEasing,
			useNativeDriver: true,
		}).start();
	}

	private confirmStartDirect = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		const text = (
			<RX.Text style={styles.textDialog}>
				<RX.Text>{pressOKToStartDM1[this.language]}</RX.Text>
				<RX.Text style={{ fontWeight: 'bold' }}>{this.props.user.name}</RX.Text>
				<RX.Text>{pressOKToStartDM2[this.language]}</RX.Text>
			</RX.Text>
		);

		this.confirmationDialog = (
			<DialogContainer
				content={text}
				confirmButton={true}
				confirmButtonText={'OK'}
				cancelButton={true}
				backgroundColor={OPAQUE_LIGHT_BACKGROUND}
				cancelButtonText={cancel[this.language]}
				onConfirm={this.startNewDirect}
				onCancel={this.dismissDialog}
			/>
		);

		this.setState({ showConfirmationDialog: true });
	};

	private startNewDirect = () => {
		RX.Modal.dismissAll();

		SpinnerUtils.showModalSpinner('new_direct_spinner');

		const existingDirectRooms = DataStore.getSortedRoomList()
			.filter(room => room.contactId === this.props.user.id)
			.sort((a, b) => Number(b.active) - Number(a.active) || b.newEvents[0].time - a.newEvents[0].time);

		if (existingDirectRooms.length > 0) {
			SpinnerUtils.dismissModalSpinner('new_direct_spinner');

			this.props.showRoom ? this.props.showRoom(existingDirectRooms[0].id) : null;
		} else {
			ApiClient.getUserProfile(this.props.user.id)
				.then(_response => {
					ApiClient.createNewRoom('direct', '', this.props.user.id)
						.then(response => {
							RX.Modal.dismissAll();

							this.props.showRoom ? this.props.showRoom(response.room_id) : null;
						})
						.catch(_error => {
							RX.Modal.dismissAll();

							const text = <RX.Text style={styles.textDialog}>{errorNoConfirm[this.language]}</RX.Text>;

							RX.Modal.show(
								<DialogContainer
									content={text}
									modalId={'errordialog'}
								/>,
								'errordialog'
							);
						});
				})
				.catch(_error => {
					RX.Modal.dismiss('new_direct_spinner');

					const text = (
						<RX.Text style={styles.textDialog}>
							<RX.Text>{theUserId[this.language]}</RX.Text>
							<RX.Text style={{ fontWeight: 'bold' }}>{' ' + this.props.user.id + ' '}</RX.Text>
							<RX.Text>{doesntSeemToExist[this.language]}</RX.Text>
						</RX.Text>
					);

					const modalDialog = (
						<DialogContainer
							content={text}
							cancelButton={true}
							cancelButtonText={'OK'}
							onCancel={() => RX.Modal.dismissAll()}
						/>
					);

					RX.Modal.show(modalDialog, 'modaldialog_useridnotfound');
				});
		}
	};

	private confirmKickMember = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		const text = (
			<RX.Text style={styles.textDialog}>
				<RX.Text>{doYouReallyWantToRemove1[this.language]}</RX.Text>
				<RX.Text style={{ fontWeight: 'bold' }}>{this.props.user.name}</RX.Text>
				<RX.Text>{doYouReallyWantToRemove2[this.language]}</RX.Text>
				<RX.Text style={{ fontWeight: 'bold' }}>{this.groupName}</RX.Text>
				<RX.Text>{doYouReallyWantToRemove3[this.language]}</RX.Text>
			</RX.Text>
		);

		this.confirmationDialog = (
			<DialogContainer
				content={text}
				confirmButton={true}
				confirmButtonText={'OK'}
				cancelButton={true}
				backgroundColor={OPAQUE_LIGHT_BACKGROUND}
				cancelButtonText={cancel[this.language]}
				onConfirm={this.kickMember}
				onCancel={this.dismissDialog}
			/>
		);

		this.setState({ showConfirmationDialog: true });
	};

	private kickMember = () => {
		this.confirmationDialog = undefined;
		this.setState({
			showConfirmationDialog: false,
			showSpinner: true,
		});

		ApiClient.kickMember(this.props.roomId, this.props.user.id)
			.then(_response => {
				RX.Modal.dismissAll();

				const text = <RX.Text style={styles.textDialog}>{memberWasRemoved[this.language]}</RX.Text>;

				RX.Modal.show(
					<DialogContainer
						content={text}
						modalId={'member_kicked'}
					/>,
					'member_kicked'
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
						modalId={'error_dialog'}
					/>,
					'error_dialog'
				);
			});
	};

	private dismissDialog = () => {
		RX.Modal.dismiss('dialog_user_tile');
	};

	public render(): JSX.Element | null {
		let contextMenu: ReactElement | undefined;
		let kickButton: ReactElement | undefined;
		let startDMButton: ReactElement | undefined;
		let n;

		if (!this.state.showConfirmationDialog && !this.state.showSpinner) {
			n = 1;
			let buttonIsDisabled: boolean;
			const isGroupRoom = ['group', 'community'].includes(this.props.roomType);
			const isOwnTile = ApiClient.credentials.userIdFull === this.props.user.id;

			buttonIsDisabled = this.state.offline || isOwnTile || !isGroupRoom;
			startDMButton = (
				<RX.Button
					style={styles.buttonDialog}
					onPress={event => this.confirmStartDirect(event)}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
					disabled={buttonIsDisabled}
					disabledOpacity={1}
				>
					<RX.Text
						allowFontScaling={false}
						style={[styles.buttonText, { opacity: buttonIsDisabled ? 0.3 : 1 }]}
					>
						{startChat[this.language]}
					</RX.Text>
					<IconSvg
						source={require('../resources/svg/RI_startchat.json') as SvgFile}
						style={{ opacity: buttonIsDisabled ? 0.3 : 1 }}
						fillColor={ICON_INFO_FILL}
						height={ICON_INFO_SIZE}
						width={ICON_INFO_SIZE}
					/>
				</RX.Button>
			);

			n++;
			const isAdmin = this.powerLevel === 100;
			buttonIsDisabled = this.state.offline || !isAdmin || isOwnTile || !isGroupRoom;
			kickButton = (
				<RX.Button
					style={styles.buttonDialog}
					onPress={event => this.confirmKickMember(event)}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
					disabled={buttonIsDisabled}
					disabledOpacity={1}
				>
					<RX.Text
						allowFontScaling={false}
						style={[styles.buttonText, { color: BUTTON_WARNING_TEXT, opacity: buttonIsDisabled ? 0.3 : 1 }]}
					>
						{removeUser[this.language]}
					</RX.Text>
					<IconSvg
						source={require('../resources/svg/RI_msg_delete.json') as SvgFile}
						style={{ opacity: buttonIsDisabled ? 0.3 : 1 }}
						fillColor={BUTTON_WARNING_TEXT}
						height={ICON_INFO_SIZE}
						width={ICON_INFO_SIZE}
					/>
				</RX.Button>
			);

			const right = -OBJECT_MARGIN;
			const appLayout = UiStore.getAppLayout_();
			const containerHeight = n * (STACKED_BUTTON_HEIGHT + 2 * 1);

			let top = this.props.layout.height - STACKED_BUTTON_HEIGHT / 2;
			top = Math.min(top, appLayout.screenHeight - this.props.layout.y - containerHeight);
			top = Math.max(top, -1 * this.props.layout.y);

			contextMenu = (
				<RX.Animated.View style={[this.animatedStyle, styles.buttonContainer, { top: top, right: right }]}>
					{startDMButton}
					{kickButton}
				</RX.Animated.View>
			);
		}

		let spinner: ReactElement | undefined;
		if (this.state.showSpinner) {
			spinner = (
				<RX.View
					style={styles.spinnerContainer}
					blockPointerEvents={!this.state.showSpinner}
				>
					<Spinner isVisible={true} />
				</RX.View>
			);
		}

		return (
			<RX.View
				style={styles.modalScreen}
				onPress={() => {
					this.state.showConfirmationDialog || this.state.showSpinner ? null : this.dismissDialog();
				}}
				disableTouchOpacityAnimation={true}
			>
				<RX.View
					style={[
						styles.modalMessage,
						{
							width: this.props.layout.width,
							height: this.props.layout.height,
							left: this.props.layout.x,
							top: this.props.layout.y,
						},
					]}
				>
					<UserTile
						user={this.props.user}
						roomId={this.props.roomId}
						roomType={this.props.roomType}
					/>
					<RX.View
						style={[
							styles.modalMessageCover,
							{
								width: this.props.layout.width,
								height: this.props.layout.height,
							},
						]}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					/>
					{contextMenu}
				</RX.View>
				{this.confirmationDialog}
				{spinner}
			</RX.View>
		);
	}
}
