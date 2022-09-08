import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { MessageEvent } from '../models/MessageEvent';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import MessageTile from '../components/MessageTile';
import DialogRoomPicker from './DialogRoomPicker';
import {
	OPAQUE_BACKGROUND,
	BUTTON_MODAL_BACKGROUND,
	BUTTON_MODAL_TEXT,
	BUTTON_DISABLED_TEXT,
	BORDER_RADIUS,
	STACKED_BUTTON_HEIGHT,
	FONT_LARGE,
	SPACING,
	TRANSPARENT_BACKGROUND,
	OPAQUE_LIGHT_BACKGROUND,
	OBJECT_MARGIN,
	ICON_INFO_SIZE,
	ICON_INFO_FILL,
	BUTTON_WARNING_TEXT,
	BUTTON_MENU_WIDTH,
} from '../ui';
import { LayoutInfo } from 'reactxp/dist/common/Types';
import DataStore from '../stores/DataStore';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import {
	forward,
	reply,
	forwardTo,
	messageCouldNotBeSent,
	noApplicationWasFound,
	open,
	save,
	share,
	fileCouldNotAccess,
	fileHasBeenSaved,
	fileHasBeenSavedAndroid,
	fileCouldNotBeSaved,
	Languages,
	report,
	messageHasBeenReported,
	cancel,
	doYouReallyWantToReport,
	pressOKToForward1,
	pressOKToForward2,
	toFolder,
	close,
	noFileExplorerWasFound,
	details,
	deleteMessage,
	doYouReallyWantToDelete,
	messageHasBeenDeleted,
} from '../translations';
import FileHandler from '../modules/FileHandler';
import ShareHandlerOutgoing from '../modules/ShareHandlerOutgoing';
import { ErrorResponse_, MessageEventContentInfo_, MessageEventContent_, RoomType } from '../models/MatrixApi';
import SpinnerUtils from '../utils/SpinnerUtils';
import Spinner from '../components/Spinner';
import AppFont from '../modules/AppFont';
import StringUtils from '../utils/StringUtils';
import IconSvg, { SvgFile } from '../components/IconSvg';

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
		width: BUTTON_MENU_WIDTH,
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

interface DialogMessageTileProps extends RX.CommonProps {
	roomId: string;
	event: MessageEvent;
	roomType: RoomType;
	readMarkerType?: string;
	replyMessage?: MessageEvent;
	setReplyMessage: (message: MessageEvent | undefined) => void;
	showTempForwardedMessage?: (roomId: string, message?: MessageEvent, tempId?: string) => void;
	layout: LayoutInfo;
}

interface DialogMessageTileState {
	offline: boolean;
	showSpinner: boolean;
	showConfirmationDialog: boolean;
	withSenderDetails: boolean;
}

export default class DialogMessageTile extends ComponentBase<DialogMessageTileProps, DialogMessageTileState> {
	private language: Languages = 'en';
	private isElectron: boolean;
	private isMobile: boolean;
	private isMedia: boolean;
	private animatedScale: RX.Animated.Value;
	private animatedTranslateX: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
	private confirmationDialog: ReactElement | undefined;
	private rightAlignment: boolean;

	constructor(props: DialogMessageTileProps) {
		super(props);

		this.language = UiStore.getLanguage();
		this.isElectron = UiStore.getIsElectron();
		this.isMobile = ['android', 'ios'].includes(UiStore.getPlatform());
		this.isMedia = ['m.file', 'm.image', 'm.video'].includes(this.props.event.content.msgtype!);

		this.rightAlignment =
			this.props.roomType === 'notepad' || this.props.event.senderId !== ApiClient.credentials.userIdFull;

		this.animatedScale = RX.Animated.createValue(animatedSizeStart);
		this.animatedTranslateX = RX.Animated.createValue((BUTTON_MENU_WIDTH / 2) * (this.rightAlignment ? 1 : -1));
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			transform: [{ translateX: this.animatedTranslateX }, { scale: this.animatedScale }],
		});

		props.setReplyMessage(undefined);
	}

	protected _buildState(
		_nextProps: DialogMessageTileProps,
		initState: boolean,
		_prevState: DialogMessageTileState
	): Partial<DialogMessageTileState> {
		const partialState: Partial<DialogMessageTileState> = {};

		if (initState) {
			partialState.showConfirmationDialog = false;
			partialState.showSpinner = false;
			partialState.withSenderDetails = false;
		}

		partialState.offline = UiStore.getOffline();

		return partialState;
	}

	public componentDidMount(): void {
		super.componentDidMount();

		RX.Animated.parallel([
			RX.Animated.timing(this.animatedScale, {
				duration: animatedDuration,
				toValue: 1,
				easing: animatedEasing,
				useNativeDriver: true,
			}),
			RX.Animated.timing(this.animatedTranslateX, {
				duration: animatedDuration,
				toValue: 0,
				easing: animatedEasing,
				useNativeDriver: true,
			}),
		]).start();
	}

	private setReplyMessage = () => {
		RX.Modal.dismissAll();

		this.props.setReplyMessage(this.props.event);
	};

	private showRoomList = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		this.confirmationDialog = (
			<DialogRoomPicker
				onPressRoom={this.confirmForwardMessage}
				label={forwardTo[this.language] + '...'}
				backgroundColor={OPAQUE_LIGHT_BACKGROUND}
			/>
		);

		this.setState({ showConfirmationDialog: true });
	};

	private confirmForwardMessage = (roomId: string) => {
		this.setState({ showConfirmationDialog: false });

		const text = (
			<RX.Text style={styles.textDialog}>
				<RX.Text>{pressOKToForward1[this.language]}</RX.Text>
				<RX.Text style={styles.boldText}>{' ' + DataStore.getRoomName(roomId)}</RX.Text>
				<RX.Text>{' ' + pressOKToForward2[this.language]}</RX.Text>
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
				onConfirm={() => this.forwardMessage(roomId)}
				onCancel={() => RX.Modal.dismissAll()}
			/>
		);

		this.setState({ showConfirmationDialog: true });
	};

	private forwardMessage = (roomId: string) => {
		RX.Modal.dismiss('dialogMessageTile');

		SpinnerUtils.showModalSpinner('forwardmessagespinner');

		const showError = () => {
			const text = <RX.Text style={styles.textDialog}>{messageCouldNotBeSent[this.language]}</RX.Text>;

			RX.Modal.show(
				<DialogContainer
					content={text}
					modalId={'errordialog'}
				/>,
				'errordialog'
			);

			this.props.showTempForwardedMessage!(roomId, undefined, '');
		};

		if (this.props.event.content.msgtype === 'm.text') {
			const tempId = 'text' + Date.now();

			this.props.showTempForwardedMessage!(roomId, this.props.event, tempId);

			ApiClient.sendMessage(roomId, this.props.event.content, tempId).catch(_error => {
				showError();
			});
		} else {
			const tempId = 'media' + Date.now();

			this.props.showTempForwardedMessage!(roomId, this.props.event, tempId);

			const messageContentInfo: MessageEventContentInfo_ = {
				h: this.props.event.content.info!.h,
				w: this.props.event.content.info!.w,
				size: this.props.event.content.info!.size,
				mimetype: this.props.event.content.info!.mimetype,
				thumbnail_info: this.props.event.content.info!.thumbnail_info,
				thumbnail_url: this.props.event.content.info!.thumbnail_url,
			};

			const messageContent: MessageEventContent_ = {
				msgtype: StringUtils.messageMediaType(this.props.event.content.info!.mimetype!),
				body: this.props.event.content.body,
				info: messageContentInfo,
				url: this.props.event.content.url,
			};

			ApiClient.sendMessage(roomId, messageContent, tempId).catch(_error => {
				showError();
			});
		}
	};
	private viewDetails = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		this.setState({ withSenderDetails: true });
	};

	private viewFile = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		const fetchProgress = (_progress: number) => {
			// not used yet
		};

		const onSuccess = (success: boolean) => {
			if (success) {
				SpinnerUtils.dismissModalSpinner('viewfilespinner');
			} else {
				RX.Modal.dismiss('viewfilespinner');

				const text = (
					<RX.Text style={styles.textDialog}>
						<RX.Text>{fileCouldNotAccess[this.language]}</RX.Text>
					</RX.Text>
				);

				RX.Modal.show(<DialogContainer content={text} />, 'errorDialog');
			}
		};

		const onNoAppFound = () => {
			RX.Modal.dismiss('viewfilespinner');

			const text = (
				<RX.Text style={styles.textDialog}>
					<RX.Text>{noApplicationWasFound[this.language]}</RX.Text>
				</RX.Text>
			);

			RX.Modal.show(<DialogContainer content={text} />, 'warningDialog');
		};

		RX.Modal.dismiss('dialogMessageTile');

		SpinnerUtils.showModalSpinner('viewfilespinner');

		FileHandler.viewFile(this.props.event, fetchProgress, onSuccess, onNoAppFound);
	};

	private saveFile = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		const isAndroid = UiStore.getPlatform() === 'android';

		const onSuccess = (success: boolean, fileName: string) => {
			RX.Modal.dismiss('savefilespinner');

			if (success) {
				if (isAndroid) {
					const message = fileHasBeenSavedAndroid[this.language];

					const text = (
						<RX.View style={styles.saveDialog}>
							<RX.Text
								style={[styles.saveDialogText, { fontWeight: 'bold', marginBottom: OBJECT_MARGIN }]}
							>
								{fileName}
							</RX.Text>
							<RX.Text style={styles.saveDialogText}>{message}</RX.Text>
						</RX.View>
					);

					const onNoAppFound = () => {
						RX.Modal.dismissAll();

						const text = (
							<RX.Text style={styles.textDialog}>
								<RX.Text>{noFileExplorerWasFound[this.language]}</RX.Text>
							</RX.Text>
						);

						RX.Modal.show(<DialogContainer content={text} />, 'warningDialog');
					};

					const saveConfirmation = (
						<DialogContainer
							content={text}
							confirmButton={true}
							confirmButtonText={toFolder[this.language]}
							cancelButton={true}
							cancelButtonText={close[this.language]}
							onConfirm={() => FileHandler.openFileExplorer(onNoAppFound)}
							onCancel={() => RX.Modal.dismissAll()}
						/>
					);

					RX.Modal.show(saveConfirmation, 'fileSavedDialog');
				} else {
					const message = fileHasBeenSaved[this.language];

					const text = (
						<RX.Text style={styles.textDialog}>
							<RX.Text>{message}</RX.Text>
						</RX.Text>
					);

					RX.Modal.show(<DialogContainer content={text} />, 'successDialog');
				}
			} else {
				const text = (
					<RX.Text style={styles.textDialog}>
						<RX.Text>{fileCouldNotBeSaved[this.language]}</RX.Text>
					</RX.Text>
				);

				RX.Modal.show(<DialogContainer content={text} />, 'errorDialog');
			}
		};

		const onAbort = () => {
			SpinnerUtils.dismissModalSpinner('savefilespinner');
		};

		RX.Modal.dismiss('dialogMessageTile');

		SpinnerUtils.showModalSpinner('savefilespinner');

		// on electron, without timeout, the dialog does not dismiss and spinner doesn't show
		if (UiStore.getIsElectron()) {
			setTimeout(() => {
				FileHandler.saveFile(this.props.event, onSuccess, onAbort).catch(_error => null);
			}, 200);
		} else {
			FileHandler.saveFile(this.props.event, onSuccess, onAbort).catch(_error => null);
		}
	};

	private shareExternal = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		const onSuccess = (success: boolean) => {
			if (success) {
				SpinnerUtils.dismissModalSpinner('sharecontentspinner');
			} else {
				RX.Modal.dismiss('sharecontentspinner');

				const text = (
					<RX.Text style={styles.textDialog}>
						<RX.Text>{fileCouldNotAccess[this.language]}</RX.Text>
					</RX.Text>
				);

				RX.Modal.show(<DialogContainer content={text} />, 'errorDialog');
			}
		};

		RX.Modal.dismiss('dialogMessageTile');

		SpinnerUtils.showModalSpinner('sharecontentspinner');

		ShareHandlerOutgoing.shareContent(this.props.event, onSuccess);
	};

	private confirmReportMessage = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		const text = <RX.Text style={styles.textDialog}>{doYouReallyWantToReport[this.language]}</RX.Text>;

		this.confirmationDialog = (
			<DialogContainer
				content={text}
				confirmButton={true}
				confirmButtonText={'OK'}
				cancelButton={true}
				backgroundColor={OPAQUE_LIGHT_BACKGROUND}
				cancelButtonText={cancel[this.language]}
				onConfirm={this.reportMessage}
				onCancel={() => RX.Modal.dismissAll()}
			/>
		);

		this.setState({ showConfirmationDialog: true });
	};

	private confirmDeleteMessage = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		const text = <RX.Text style={styles.textDialog}>{doYouReallyWantToDelete[this.language]}</RX.Text>;

		this.confirmationDialog = (
			<DialogContainer
				content={text}
				confirmButton={true}
				confirmButtonText={'OK'}
				cancelButton={true}
				backgroundColor={OPAQUE_LIGHT_BACKGROUND}
				cancelButtonText={cancel[this.language]}
				onConfirm={this.deleteMessage}
				onCancel={() => RX.Modal.dismissAll()}
			/>
		);

		this.setState({ showConfirmationDialog: true });
	};

	private reportMessage = () => {
		this.confirmationDialog = undefined;
		this.setState({
			showConfirmationDialog: false,
			showSpinner: true,
		});

		ApiClient.reportMessage(this.props.roomId, this.props.event.eventId)
			.then(_response => {
				RX.Modal.dismiss('dialogMessageTile');

				const text = <RX.Text style={styles.textDialog}>{messageHasBeenReported[this.language]}</RX.Text>;

				RX.Modal.show(
					<DialogContainer
						content={text}
						modalId={'messageReported'}
					/>,
					'messageReported'
				);
			})
			.catch((error: ErrorResponse_) => {
				RX.Modal.dismiss('dialogMessageTile');

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

	private deleteMessage = () => {
		this.confirmationDialog = undefined;
		this.setState({
			showConfirmationDialog: false,
			showSpinner: true,
		});

		ApiClient.redactMessage(this.props.roomId, this.props.event.eventId)
			.then(_response => {
				RX.Modal.dismiss('dialogMessageTile');

				const text = <RX.Text style={styles.textDialog}>{messageHasBeenDeleted[this.language]}</RX.Text>;

				RX.Modal.show(
					<DialogContainer
						content={text}
						modalId={'messageDeleted'}
					/>,
					'messageDeleted'
				);
			})
			.catch((error: ErrorResponse_) => {
				RX.Modal.dismiss('dialogMessageTile');

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

	public render(): JSX.Element | null {
		let contextMenu: ReactElement | undefined;
		let detailsButton: ReactElement | undefined;
		let openButton: ReactElement | undefined;
		let saveAsButton: ReactElement | undefined;
		let shareButton: ReactElement | undefined;
		let forwardButton: ReactElement | undefined;
		let replyButton: ReactElement | undefined;
		let forwardConfirmButton: ReactElement | undefined;
		let reportButton: ReactElement | undefined;
		let deleteButton: ReactElement | undefined;
		let n;

		if (!this.state.showConfirmationDialog && !this.state.showSpinner && !this.state.withSenderDetails) {
			n = 1;
			if (
				['community', 'group'].includes(this.props.roomType) &&
				ApiClient.credentials.userIdFull !== this.props.event.senderId
			) {
				n++;
				detailsButton = (
					<RX.Button
						style={styles.buttonDialog}
						onPress={event => this.viewDetails(event)}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					>
						<RX.Text
							allowFontScaling={false}
							style={[
								styles.buttonText,
								this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined,
							]}
						>
							{details[this.language]}
						</RX.Text>
						<IconSvg
							source={require('../resources/svg/RI_info.json') as SvgFile}
							fillColor={ICON_INFO_FILL}
							height={ICON_INFO_SIZE}
							width={ICON_INFO_SIZE}
						/>
					</RX.Button>
				);
			}

			if (this.isMedia && (this.isElectron || this.isMobile)) {
				n++;
				openButton = (
					<RX.Button
						style={styles.buttonDialog}
						onPress={event => this.viewFile(event)}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
						disabled={this.state.offline}
						disabledOpacity={1}
					>
						<RX.Text
							allowFontScaling={false}
							style={[
								styles.buttonText,
								this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined,
							]}
						>
							{open[this.language]}
						</RX.Text>
						<IconSvg
							source={require('../resources/svg/RI_msg_open.json') as SvgFile}
							fillColor={ICON_INFO_FILL}
							height={ICON_INFO_SIZE}
							width={ICON_INFO_SIZE}
						/>
					</RX.Button>
				);
			}

			if (this.isMedia && (this.isElectron || this.isMobile)) {
				n++;
				saveAsButton = (
					<RX.Button
						style={styles.buttonDialog}
						onPress={event => this.saveFile(event)}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
						disabled={this.state.offline}
						disabledOpacity={1}
					>
						<RX.Text
							allowFontScaling={false}
							style={[
								styles.buttonText,
								this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined,
							]}
						>
							{save[this.language]}
						</RX.Text>
						<IconSvg
							source={require('../resources/svg/RI_msg_save.json') as SvgFile}
							fillColor={ICON_INFO_FILL}
							height={ICON_INFO_SIZE}
							width={ICON_INFO_SIZE}
						/>
					</RX.Button>
				);
			}

			if (this.isMobile) {
				n++;
				shareButton = (
					<RX.Button
						style={styles.buttonDialog}
						onPress={event => this.shareExternal(event)}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
						disabled={this.state.offline}
						disabledOpacity={1}
					>
						<RX.Text
							allowFontScaling={false}
							style={[
								styles.buttonText,
								this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined,
							]}
						>
							{share[this.language]}
						</RX.Text>
						<IconSvg
							source={require('../resources/svg/RI_msg_share.json') as SvgFile}
							fillColor={ICON_INFO_FILL}
							height={ICON_INFO_SIZE}
							width={ICON_INFO_SIZE}
						/>
					</RX.Button>
				);
			}

			if (this.props.roomType !== 'notepad') {
				n++;
				replyButton = (
					<RX.Button
						style={styles.buttonDialog}
						onPress={this.setReplyMessage}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
						disabled={this.state.offline}
						disabledOpacity={1}
					>
						<RX.Text
							allowFontScaling={false}
							style={[
								styles.buttonText,
								this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined,
							]}
						>
							{reply[this.language]}
						</RX.Text>
						<IconSvg
							source={require('../resources/svg/RI_msg_reply.json') as SvgFile}
							fillColor={ICON_INFO_FILL}
							height={ICON_INFO_SIZE}
							width={ICON_INFO_SIZE}
						/>
					</RX.Button>
				);
			}

			forwardButton = (
				<RX.Button
					style={styles.buttonDialog}
					onPress={event => this.showRoomList(event)}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
					disabled={this.state.offline}
					disabledOpacity={1}
				>
					<RX.Text
						allowFontScaling={false}
						style={[styles.buttonText, this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined]}
					>
						{forward[this.language]}
					</RX.Text>
					<IconSvg
						source={require('../resources/svg/RI_msg_forward.json') as SvgFile}
						fillColor={ICON_INFO_FILL}
						height={ICON_INFO_SIZE}
						width={ICON_INFO_SIZE}
					/>
				</RX.Button>
			);

			if (ApiClient.credentials.userIdFull === this.props.event.senderId) {
				n++;
				deleteButton = (
					<RX.Button
						style={styles.buttonDialog}
						onPress={this.confirmDeleteMessage}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					>
						<RX.Text
							allowFontScaling={false}
							style={[
								styles.buttonText,
								this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined,
							]}
						>
							{deleteMessage[this.language]}
						</RX.Text>
						<IconSvg
							source={require('../resources/svg/RI_msg_delete.json') as SvgFile}
							fillColor={ICON_INFO_FILL}
							height={ICON_INFO_SIZE}
							width={ICON_INFO_SIZE}
						/>
					</RX.Button>
				);
			}

			if (this.props.roomType === 'community') {
				n++;
				reportButton = (
					<RX.Button
						style={styles.buttonDialog}
						onPress={this.confirmReportMessage}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
						disabled={this.state.offline}
						disabledOpacity={1}
					>
						<RX.Text
							allowFontScaling={false}
							style={[
								styles.buttonText,
								{ color: this.state.offline ? BUTTON_DISABLED_TEXT : BUTTON_WARNING_TEXT },
							]}
						>
							{report[this.language]}
						</RX.Text>
						<IconSvg
							source={require('../resources/svg/RI_msg_report.json') as SvgFile}
							fillColor={BUTTON_WARNING_TEXT}
							height={ICON_INFO_SIZE}
							width={ICON_INFO_SIZE}
						/>
					</RX.Button>
				);
			}

			let right = undefined;
			let left = undefined;
			if (this.rightAlignment) {
				right = 0;
			} else {
				left = 0;
			}

			const appLayout = UiStore.getAppLayout_();
			const containerHeight = n * (STACKED_BUTTON_HEIGHT + 2 * 1);
			let top = (this.props.layout.height - containerHeight - 1) / 2;
			top = Math.min(top, appLayout.screenHeight - this.props.layout.y - containerHeight);
			top = Math.max(top, -1 * this.props.layout.y);

			contextMenu = (
				<RX.Animated.View
					style={[this.animatedStyle, styles.buttonContainer, { top: top, right: right, left: left }]}
				>
					{detailsButton}
					{openButton}
					{saveAsButton}
					{shareButton}
					{forwardButton}
					{replyButton}
					{forwardConfirmButton}
					{deleteButton}
					{reportButton}
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
					this.state.showConfirmationDialog || this.state.showSpinner ? null : RX.Modal.dismissAll();
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
					<MessageTile
						roomId={this.props.roomId}
						event={this.props.event}
						roomType={this.props.roomType}
						replyMessage={this.props.replyMessage}
						readMarkerType={this.props.readMarkerType}
						isRedacted={false}
						withSenderDetails={this.state.withSenderDetails}
						setReplyMessage={() => null}
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
