import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import MessageTile from '../components/MessageTile';
import DialogRoomPicker from './DialogRoomPicker';
import {
	OPAQUE_BACKGROUND,
	BUTTON_MODAL_TEXT,
	BORDER_RADIUS,
	STACKED_BUTTON_HEIGHT,
	FONT_LARGE,
	TRANSPARENT_BACKGROUND,
	OPAQUE_LIGHT_BACKGROUND,
	OBJECT_MARGIN,
	BUTTON_WARNING_TEXT,
	BUTTON_MENU_WIDTH,
	LIGHT_BACKGROUND,
	HEADER_TEXT,
	OPAQUE_MEDIUM_BACKGROUND,
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
import { ErrorResponse_, FileInfo_, ImageInfo_, MessageEventContent_, RoomType, VideoInfo_ } from '../models/MatrixApi';
import SpinnerUtils from '../utils/SpinnerUtils';
import Spinner from '../components/Spinner';
import AppFont from '../modules/AppFont';
import StringUtils from '../utils/StringUtils';
import { SvgFile } from '../components/IconSvg';
import { FilteredChatEvent } from '../models/FilteredChatEvent';
import MenuButton from '../components/MenuButton';

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
		width: BUTTON_MENU_WIDTH,
		height: 32,
		borderRadius: 32 / 2,
		backgroundColor: OPAQUE_MEDIUM_BACKGROUND,
		marginBottom: 5,
	}),
	buttonText: RX.Styles.createTextStyle({
		flex: 1,
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		marginLeft: OBJECT_MARGIN,
		textAlign: 'left',
		color: HEADER_TEXT,
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
const animatedDuration = 200;
const animatedEasing = RX.Animated.Easing.Out();

interface DialogMessageTileProps extends RX.CommonProps {
	roomId: string;
	event: FilteredChatEvent;
	roomType: RoomType;
	readMarkerType?: string;
	replyMessage?: FilteredChatEvent;
	setReplyMessage: (message: FilteredChatEvent | undefined) => void;
	showTempForwardedMessage?: (roomId: string, message?: FilteredChatEvent, tempId?: string) => void;
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
	private animatedOpacity: RX.Animated.Value;
	private animatedTranslateX: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
	private animatedStyleOpacity: RX.Types.AnimatedViewStyleRuleSet;
	private confirmationDialog: ReactElement | undefined;
	private rightAlignment: boolean;

	constructor(props: DialogMessageTileProps) {
		super(props);

		this.language = UiStore.getLanguage();
		this.isElectron = UiStore.getIsElectron();
		this.isMobile = ['android', 'ios'].includes(UiStore.getPlatform());
		this.isMedia = ['m.file', 'm.image', 'm.video'].includes(
			(props.event.content as MessageEventContent_).msgtype!
		);

		this.rightAlignment = props.roomType === 'notepad' || props.event.senderId !== ApiClient.credentials.userIdFull;

		this.animatedScale = RX.Animated.createValue(animatedSizeStart);
		this.animatedTranslateX = RX.Animated.createValue((BUTTON_MENU_WIDTH / 2) * (this.rightAlignment ? 1 : -1));
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			transform: [{ translateX: this.animatedTranslateX }, { scale: this.animatedScale }],
		});

		this.animatedOpacity = RX.Animated.createValue(0);
		this.animatedStyleOpacity = RX.Styles.createAnimatedViewStyle({
			opacity: this.animatedOpacity,
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
			RX.Animated.timing(this.animatedOpacity, {
				duration: animatedDuration,
				toValue: 1,
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

		const content = this.props.event.content as MessageEventContent_;
		if (content.msgtype === 'm.text') {
			const tempId = 'text' + Date.now();

			this.props.showTempForwardedMessage!(roomId, this.props.event, tempId);

			ApiClient.sendMessage(roomId, content, tempId).catch(_error => {
				showError();
			});
		} else {
			const tempId = 'media' + Date.now();

			this.props.showTempForwardedMessage!(roomId, this.props.event, tempId);

			let contentInfo;
			let info;

			switch (content.msgtype) {
				case 'm.image':
					info = content.info as ImageInfo_;
					contentInfo = {
						mimetype: info.mimetype,
						size: info.size,
						h: info.h,
						w: info.w,
						thumbnail_url: info.thumbnail_info,
						thumbnail_info: info.thumbnail_url,
					} as ImageInfo_;
					break;

				case 'm.video':
					info = content.info as VideoInfo_;
					contentInfo = {
						mimetype: info.mimetype,
						duration: undefined,
						size: info.size,
						h: info.h,
						w: info.w,
						thumbnail_url: info.thumbnail_info,
						thumbnail_info: info.thumbnail_url,
					} as VideoInfo_;
					break;

				default:
					info = content.info as FileInfo_;
					contentInfo = {
						mimetype: info.mimetype,
						size: info.size,
						thumbnail_url: info.thumbnail_info,
						thumbnail_info: info.thumbnail_url,
					} as FileInfo_;
					break;
			}

			const messageContent: MessageEventContent_ = {
				msgtype: StringUtils.messageMediaType(info.mimetype!),
				body: content.body,
				info: contentInfo,
				url: content.url,
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
					<MenuButton
						buttonStyle={styles.buttonDialog}
						iconSource={require('../resources/svg/RI_info.json') as SvgFile}
						iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
						iconFillColor={HEADER_TEXT}
						iconHeight={20}
						iconWidth={20}
						animatedColor={LIGHT_BACKGROUND}
						onPress={event => this.viewDetails(event)}
						disabled={this.state.offline}
						text={details[this.language]}
						textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
						buttonHeight={32}
					/>
				);
			}

			if (this.isMedia && (this.isElectron || this.isMobile)) {
				n++;
				openButton = (
					<MenuButton
						buttonStyle={styles.buttonDialog}
						iconSource={require('../resources/svg/RI_msg_open.json') as SvgFile}
						iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
						iconFillColor={HEADER_TEXT}
						iconHeight={20}
						iconWidth={20}
						animatedColor={LIGHT_BACKGROUND}
						onPress={event => this.viewFile(event)}
						disabled={this.state.offline}
						text={open[this.language]}
						textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
						buttonHeight={32}
					/>
				);
			}

			if (this.isMedia && (this.isElectron || this.isMobile)) {
				n++;
				saveAsButton = (
					<MenuButton
						buttonStyle={styles.buttonDialog}
						iconSource={require('../resources/svg/RI_msg_save.json') as SvgFile}
						iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
						iconFillColor={HEADER_TEXT}
						iconHeight={20}
						iconWidth={20}
						animatedColor={LIGHT_BACKGROUND}
						onPress={event => this.saveFile(event)}
						disabled={this.state.offline}
						text={save[this.language]}
						textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
						buttonHeight={32}
					/>
				);
			}

			if (this.isMobile) {
				n++;
				shareButton = (
					<MenuButton
						buttonStyle={styles.buttonDialog}
						iconSource={require('../resources/svg/RI_msg_share.json') as SvgFile}
						iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
						iconFillColor={HEADER_TEXT}
						iconHeight={20}
						iconWidth={20}
						animatedColor={LIGHT_BACKGROUND}
						onPress={event => this.shareExternal(event)}
						disabled={this.state.offline}
						text={share[this.language]}
						textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
						buttonHeight={32}
					/>
				);
			}

			if (this.props.roomType !== 'notepad') {
				n++;
				replyButton = (
					<MenuButton
						buttonStyle={styles.buttonDialog}
						iconSource={require('../resources/svg/RI_msg_reply.json') as SvgFile}
						iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
						iconFillColor={HEADER_TEXT}
						iconHeight={20}
						iconWidth={20}
						animatedColor={LIGHT_BACKGROUND}
						onPress={this.setReplyMessage}
						disabled={this.state.offline}
						text={reply[this.language]}
						textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
						buttonHeight={32}
					/>
				);
			}

			forwardButton = (
				<MenuButton
					buttonStyle={styles.buttonDialog}
					iconSource={require('../resources/svg/RI_msg_forward.json') as SvgFile}
					iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
					iconFillColor={HEADER_TEXT}
					iconHeight={20}
					iconWidth={20}
					animatedColor={LIGHT_BACKGROUND}
					onPress={event => this.showRoomList(event)}
					disabled={this.state.offline}
					text={forward[this.language]}
					textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
					buttonHeight={32}
				/>
			);

			if (ApiClient.credentials.userIdFull === this.props.event.senderId) {
				n++;
				deleteButton = (
					<MenuButton
						buttonStyle={styles.buttonDialog}
						iconSource={require('../resources/svg/RI_msg_delete.json') as SvgFile}
						iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
						iconFillColor={HEADER_TEXT}
						iconHeight={20}
						iconWidth={20}
						animatedColor={LIGHT_BACKGROUND}
						onPress={this.confirmDeleteMessage}
						disabled={this.state.offline}
						text={deleteMessage[this.language]}
						textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
						buttonHeight={32}
					/>
				);
			}

			if (this.props.roomType === 'community') {
				n++;
				reportButton = (
					<MenuButton
						buttonStyle={styles.buttonDialog}
						iconSource={require('../resources/svg/RI_msg_report.json') as SvgFile}
						iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
						iconFillColor={HEADER_TEXT}
						iconHeight={20}
						iconWidth={20}
						animatedColor={LIGHT_BACKGROUND}
						onPress={this.confirmReportMessage}
						disabled={this.state.offline}
						text={report[this.language]}
						textStyle={[
							styles.buttonText,
							{ color: BUTTON_WARNING_TEXT, opacity: this.state.offline ? 0.3 : 1 },
						]}
						buttonHeight={32}
					/>
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
			<RX.Animated.View
				style={[styles.modalScreen, this.animatedStyleOpacity]}
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
						isRedacted={false}
						withSenderDetails={this.state.withSenderDetails}
						setReplyMessage={() => null}
						animatedImage={false}
						body={(this.props.event.content as MessageEventContent_).body}
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
			</RX.Animated.View>
		);
	}
}
