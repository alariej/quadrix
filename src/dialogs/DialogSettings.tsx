import React, { ReactElement } from 'react';
import RX from 'reactxp';
import {
	INPUT_BORDER,
	MODAL_CONTENT_TEXT,
	BORDER_RADIUS,
	SPACING,
	FONT_LARGE,
	FONT_NORMAL,
	CONTAINER_PADDING,
	BUTTON_HEIGHT,
	TRANSPARENT_BACKGROUND,
	MODAL_CONTENT_BACKGROUND,
	BUTTON_ROUND_BACKGROUND,
	PLACEHOLDER_TEXT,
	AVATAR_BACKGROUND,
	BUTTON_MODAL_TEXT,
	AVATAR_MEDIUM_WIDTH,
	CHECKBOX_BACKGROUND,
	DIALOG_WIDTH,
	TILE_MESSAGE_TEXT,
	BUTTON_SHORT_WIDTH,
	BUTTON_DISABLED_TEXT,
	BUTTON_MODAL_BACKGROUND,
	OPAQUE_BACKGROUND,
	AVATAR_FOREGROUND,
	BUTTON_LONG_WIDTH,
	OBJECT_MARGIN,
	ICON_REDUCTION_FACTOR,
	ICON_INFO_SIZE,
} from '../ui';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import FileHandler from '../modules/FileHandler';
import {
	newPasswordNoMatch,
	passwordChanged,
	displayName,
	enterYourName,
	profilePicture,
	userPassword,
	currentPassword,
	newPassword,
	repeatNewPassword,
	close,
	save,
	userId,
	emailAddress,
	emailNotifications,
	Languages,
	files,
	photos,
	pressOKToDeleteAccount,
	cancel,
	enterPassword,
	errorInvalidPassword,
	deleteAccount,
} from '../translations';
import IconSvg, { SvgFile } from '../components/IconSvg';
import { AuthResponse_, ErrorResponse_ } from '../models/MatrixApi';
import { FileObject } from '../models/FileObject';
import DataStore from '../stores/DataStore';
import Pushers from '../modules/Pushers';
import Spinner from '../components/Spinner';
import AppFont from '../modules/AppFont';
import CachedImage from '../modules/CachedImage';
import StringUtils from '../utils/StringUtils';

const styles = {
	modalScreen: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
	}),
	contentContainer: RX.Styles.createViewStyle({
		alignSelf: 'stretch',
	}),
	zoomContainer: RX.Styles.createViewStyle({
		marginBottom: SPACING,
		flexDirection: 'row',
	}),
	buttonsContainer: RX.Styles.createViewStyle({
		flex: 1,
		justifyContent: 'space-between',
		flexDirection: 'row',
		marginBottom: SPACING,
	}),
	zoomButton: RX.Styles.createViewStyle({
		width: (DIALOG_WIDTH - 2 * SPACING) / 3,
		height: BUTTON_HEIGHT,
		borderRadius: BORDER_RADIUS,
		backgroundColor: BUTTON_ROUND_BACKGROUND,
	}),
	containerIcon: RX.Styles.createViewStyle({
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	}),
	zoomButtonText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: 24,
		color: TILE_MESSAGE_TEXT,
	}),
	settingsContainer: RX.Styles.createViewStyle({
		padding: SPACING,
		paddingTop: 2 * SPACING,
		borderRadius: BORDER_RADIUS,
		backgroundColor: MODAL_CONTENT_BACKGROUND,
	}),
	spinnerContainer: RX.Styles.createViewStyle({
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
	}),
	rowContainer: RX.Styles.createViewStyle({
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: SPACING,
	}),
	label: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: PLACEHOLDER_TEXT,
		width: 96,
		textAlign: 'right',
		padding: SPACING,
	}),
	inputBox: RX.Styles.createTextInputStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		paddingHorizontal: CONTAINER_PADDING,
		height: BUTTON_HEIGHT,
		borderRadius: BORDER_RADIUS,
		borderWidth: 1,
		borderColor: INPUT_BORDER,
	}),
	userId: RX.Styles.createTextInputStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
	}),
	avatarContainer: RX.Styles.createViewStyle({
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		height: AVATAR_MEDIUM_WIDTH,
		width: AVATAR_MEDIUM_WIDTH,
		borderRadius: AVATAR_MEDIUM_WIDTH / 2,
		cursor: 'pointer',
		overflow: 'visible',
	}),
	avatar: RX.Styles.createImageStyle({
		flex: 1,
		width: AVATAR_MEDIUM_WIDTH,
		borderRadius: AVATAR_MEDIUM_WIDTH / 2,
		borderWidth: 1,
		borderColor: INPUT_BORDER,
		overlayColor: AVATAR_BACKGROUND,
	}),
	pickerContainer: RX.Styles.createViewStyle({
		flex: 1,
	}),
	picker: RX.Styles.createViewStyle({
		flex: 1,
	}),
	textField: RX.Styles.createViewStyle({
		flex: 1,
		height: BUTTON_HEIGHT,
		justifyContent: 'center',
	}),
	inputField: RX.Styles.createViewStyle({
		flex: 1,
		overflow: 'visible',
	}),
	textDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		color: MODAL_CONTENT_TEXT,
		fontSize: FONT_LARGE,
		margin: 12,
	}),
	emailCheckbox: RX.Styles.createButtonStyle({
		height: BUTTON_HEIGHT,
		width: BUTTON_HEIGHT,
		backgroundColor: CHECKBOX_BACKGROUND,
		borderRadius: BORDER_RADIUS,
	}),
	checkboxText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		alignSelf: 'center',
		fontWeight: 'bold',
		fontSize: 20,
	}),
	fileTypeDialog: RX.Styles.createViewStyle({
		position: 'absolute',
		top: AVATAR_MEDIUM_WIDTH / 2 - BUTTON_HEIGHT - SPACING,
		left: (-BUTTON_SHORT_WIDTH * 3) / 4,
	}),
	buttonDialog: RX.Styles.createViewStyle({
		borderRadius: BORDER_RADIUS,
		height: BUTTON_HEIGHT,
		width: BUTTON_SHORT_WIDTH,
		backgroundColor: BUTTON_MODAL_BACKGROUND,
		margin: SPACING / 2,
		shadowOffset: { width: -1, height: 1 },
		shadowColor: OPAQUE_BACKGROUND,
		shadowRadius: 3,
		elevation: 3,
		shadowOpacity: 1,
		overflow: 'visible',
	}),
	buttonText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		margin: SPACING,
		textAlign: 'center',
		color: BUTTON_MODAL_TEXT,
	}),
	buttonDeleteContainer: RX.Styles.createViewStyle({
		flex: 0,
		backgroundColor: OPAQUE_BACKGROUND,
		alignItems: 'center',
	}),
	buttonDelete: RX.Styles.createButtonStyle({
		borderRadius: BUTTON_HEIGHT / 2,
		width: BUTTON_LONG_WIDTH,
		height: BUTTON_HEIGHT,
		backgroundColor: 'white',
		marginBottom: OBJECT_MARGIN,
	}),
	buttonTextDelete: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		marginVertical: SPACING,
		textAlign: 'center',
		color: 'orangered',
	}),
};

interface DialogSettingsProps {
	showLogin: () => void;
}

interface DialogSettingsState {
	confirmDisabled: boolean;
	showSpinner: boolean;
	offline: boolean;
	showFileTypePicker: boolean;
	hideDeleteButton: boolean;
}

export default class DialogSettings extends ComponentBase<DialogSettingsProps, DialogSettingsState> {
	private displayName = '';
	private displayNameRemote = '';
	private avatarUrl = '';
	private avatarFile: FileObject | undefined;
	private currentPassword = '';
	private newPassword = '';
	private repeatNewPassword = '';
	private language: Languages;
	private webFrame: Electron.WebFrame | null;
	private zoomFactor = 1;
	private emailAddress = '';
	private emailNotifications = false;
	private emailNotificationsRemote = false;
	private nClicks = 0;
	private platform: RX.Types.PlatformType;
	private isMounted_: boolean | undefined;

	constructor(props: DialogSettingsProps) {
		super(props);

		this.language = UiStore.getLanguage();
		this.webFrame = UiStore.getIsElectron() ? window.require('electron').webFrame : null;
		this.platform = UiStore.getPlatform();
	}

	protected _buildState(_props: unknown, initState: boolean): Partial<DialogSettingsState> {
		if (initState) {
			return {
				confirmDisabled: true,
				showSpinner: true,
				showFileTypePicker: false,
				offline: UiStore.getOffline(),
				hideDeleteButton: false,
			};
		}

		return { offline: UiStore.getOffline() };
	}

	public componentDidMount(): void {
		super.componentDidMount();

		this.isMounted_ = true;

		Promise.all([this.getUserProfile(), this.get3Pid(), this.getEmailPusher()])
			.then(_response => {
				if (this.isMounted_) {
					this.setState({ showSpinner: false });
				}
			})
			.catch((error: ErrorResponse_) => {
				if (this.isMounted_) {
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
				}
			});

		if (__DEV__) {
			ApiClient.getPushRules()
				.then(response => {
					console.log('PUSH RULES:');
					console.log(response);
					console.log('PUSH RULES - ROOMS:');
					const roomsAction: { roomName: string | undefined; action: string }[] = [];
					response.room.map(room => {
						const roomAction = {
							roomName: DataStore.getRoomName(room.rule_id),
							action: room.actions[0],
						};
						roomsAction.push(roomAction);
					});
					console.log(roomsAction);
				})
				.catch(_error => null);

			ApiClient.getMatrixVersions()
				.then(response => {
					console.log('PROTOCOL VERSIONS:');
					console.log(response);
				})
				.catch(_error => null);

			ApiClient.getHomeserverInfo()
				.then(response => {
					console.log('HOMESERVER INFO:');
					console.log(response);
				})
				.catch(_error => null);
		}
	}

	public componentWillUnmount(): void {
		this.isMounted_ = false;
	}

	private getUserProfile = async (): Promise<void> => {
		const response = await ApiClient.getUserProfile(ApiClient.credentials.userIdFull).catch(error => {
			return Promise.reject(error);
		});

		if (response.displayname === ApiClient.credentials.userId) {
			this.displayName = '';
		} else {
			this.displayName = response.displayname;
		}

		this.avatarUrl = StringUtils.mxcToHttp(response.avatar_url, ApiClient.credentials.homeServer);
		this.displayNameRemote = response.displayname;

		return Promise.resolve();
	};

	private get3Pid = async (): Promise<void> => {
		const response = await ApiClient.get3pid().catch(error => {
			return Promise.reject(error);
		});

		if (response.threepids && response.threepids.length > 0) {
			response.threepids.some(threepid => {
				if (threepid.medium === 'email') {
					this.emailAddress = threepid.address;
					return true;
				} else {
					return false;
				}
			});
		}

		return Promise.resolve();
	};

	private getEmailPusher = async (): Promise<void> => {
		const response = await ApiClient.getPushers().catch(error => {
			return Promise.reject(error);
		});

		if (__DEV__) {
			console.log('PUSHER LIST:');
			console.log(response);
		}

		const isEmailPusher = response.pushers.some(item => {
			return item.app_id === 'm.email';
		});

		this.emailNotificationsRemote = isEmailPusher;
		this.emailNotifications = this.emailNotificationsRemote;

		return Promise.resolve();
	};

	private saveAvatar = async (): Promise<void> => {
		if (!this.avatarUrl || !this.avatarFile) {
			return Promise.resolve();
		}

		const fetchProgress = (_text: string, _progress: number) => {
			// not used yet
		};

		const response = await FileHandler.uploadFile(ApiClient.credentials, this.avatarFile, fetchProgress).catch(
			error => {
				return Promise.reject(error);
			}
		);

		if (!response.uri) {
			return Promise.reject('No URI found');
		}

		await ApiClient.setProfileAvatarUrl(ApiClient.credentials.userIdFull, response.uri).catch(error => {
			return Promise.reject(error);
		});

		this.avatarUrl = StringUtils.mxcToHttp(response.uri, ApiClient.credentials.homeServer);

		this.avatarFile = undefined;

		return Promise.resolve();
	};

	private saveDisplayName = async (): Promise<void> => {
		if (!this.displayName || this.displayName === this.displayNameRemote) {
			return Promise.resolve();
		}

		await ApiClient.setProfileDisplayName(ApiClient.credentials.userIdFull, this.displayName).catch(error => {
			return Promise.reject(error);
		});

		this.displayNameRemote = this.displayName;

		return Promise.resolve();
	};

	private saveNewPassword = async (): Promise<string> => {
		if (!this.newPassword || !this.currentPassword) {
			return Promise.resolve('');
		}

		const response1 = (await ApiClient.changePassword(this.newPassword).catch(async (error1: AuthResponse_) => {
			if (error1.statusCode === 401 && error1.body.flows[0].stages[0] === 'm.login.password') {
				const type = error1.body.flows[0].stages[0];
				const session = error1.body.session;

				const response2 = await ApiClient.changePassword(
					this.newPassword,
					type,
					session,
					this.currentPassword
				).catch((error2: ErrorResponse_) => {
					return Promise.resolve(error2);
				});

				return Promise.resolve(response2);
			} else {
				const error3: ErrorResponse_ = {
					statusCode: 400,
					body: {
						error: 'Server Error (unknown response)',
					},
				};

				return Promise.resolve(error3);
			}
		})) as ErrorResponse_;

		if (response1.statusCode && response1.statusCode !== 200) {
			return Promise.reject(response1);
		} else {
			return Promise.resolve('PASSWORD_CHANGED');
		}
	};

	private saveEmailNotifications = async (): Promise<void> => {
		if (!this.emailAddress || this.emailNotifications === this.emailNotificationsRemote) {
			return Promise.resolve();
		}

		await ApiClient.setEmailPusher(this.emailNotifications, this.emailAddress).catch(error => {
			return Promise.reject(error);
		});

		this.emailNotificationsRemote = this.emailNotifications;

		return Promise.resolve();
	};

	private saveSettings = () => {
		RX.UserInterface.dismissKeyboard();

		if (this.newPassword && this.newPassword !== this.repeatNewPassword) {
			const text = <RX.Text style={styles.textDialog}>{newPasswordNoMatch[this.language]}</RX.Text>;

			RX.Modal.show(
				<DialogContainer
					content={text}
					modalId={'errordialog'}
				/>,
				'errordialog'
			);

			return;
		}

		this.setState({
			confirmDisabled: true,
			showSpinner: true,
		});

		Promise.all([this.saveDisplayName(), this.saveAvatar(), this.saveNewPassword(), this.saveEmailNotifications()])
			.then(response => {
				if (this.isMounted_) {
					this.setState({ showSpinner: false });

					this.setConfirmDisabled();

					if (response[2] === 'PASSWORD_CHANGED') {
						const text = <RX.Text style={styles.textDialog}>{passwordChanged[this.language]}</RX.Text>;

						RX.Modal.show(
							<DialogContainer
								content={text}
								modalId={'passwordchangedialog'}
							/>,
							'passwordchangedialog'
						);
					}
				}
			})
			.catch((error: ErrorResponse_) => {
				if (this.isMounted_) {
					this.setState({ showSpinner: false });

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
				}
			});
	};

	private onPressAvatar = () => {
		if (this.platform === 'ios') {
			this.setState({ showFileTypePicker: !this.state.showFileTypePicker });
		} else {
			this.pickAvatarFile().catch(_error => null);
		}
	};

	private pickAvatarPhoto = async () => {
		if (this.platform === 'ios') {
			this.setState({ showFileTypePicker: false });
		}

		const file = await FileHandler.pickImage().catch(_error => null);

		if (file) {
			this.avatarFile = file;
			this.avatarUrl = file.uri;

			this.setConfirmDisabled();
		}
	};

	private pickAvatarFile = async () => {
		if (this.platform === 'ios') {
			this.setState({ showFileTypePicker: false });
		}

		const file = await FileHandler.pickFile(true).catch(_error => null);

		if (file) {
			this.avatarFile = file;
			this.avatarUrl = file.uri;

			this.setConfirmDisabled();
		}
	};

	private changeDisplayName = (displayName: string) => {
		this.displayName = displayName;

		this.setConfirmDisabled();
	};

	private changePassword = (repeatNewPassword: string) => {
		this.repeatNewPassword = repeatNewPassword;

		this.setConfirmDisabled();
	};

	private setConfirmDisabled = () => {
		const confirmDisabled =
			(!this.avatarFile || !this.avatarUrl) &&
			(!this.displayName || this.displayNameRemote === this.displayName) &&
			(!this.currentPassword || !this.newPassword || !this.repeatNewPassword) &&
			this.emailNotifications === this.emailNotificationsRemote;

		this.setState({ confirmDisabled: confirmDisabled });
	};

	private zoomIn = () => {
		this.zoomFactor = this.zoomFactor + 0.05;
		this.webFrame!.setZoomFactor(this.zoomFactor);
		ApiClient.storeZoomFactor(this.zoomFactor);
	};

	private zoomOut = () => {
		this.zoomFactor = this.zoomFactor - 0.05;
		this.webFrame!.setZoomFactor(this.zoomFactor);
		ApiClient.storeZoomFactor(this.zoomFactor);
	};

	private zoomReset = () => {
		this.zoomFactor = 1;
		this.webFrame!.setZoomFactor(1);
		ApiClient.storeZoomFactor(this.zoomFactor);
	};

	private toggleEmailNotifications = () => {
		this.emailNotifications = !this.emailNotifications;
		this.setConfirmDisabled();
	};

	private onPressUserId = () => {
		this.nClicks++;

		if (this.nClicks === 1) {
			setTimeout(() => {
				this.nClicks = 0;
			}, 5000);
		}

		if (this.nClicks === 5) {
			Pushers.removeAll(ApiClient.credentials).catch(_error => null);

			const text = <RX.Text style={styles.textDialog}>All pushers should have been removed</RX.Text>;

			RX.Modal.show(<DialogContainer content={text} />, 'pusherremovaldialog');
		}
	};

	private onPressDeleteAccount = () => {
		const text = (
			<RX.Text style={styles.textDialog}>
				{pressOKToDeleteAccount(ApiClient.credentials.homeServer, this.language)}
			</RX.Text>
		);

		const leaveRoomConfirmation = (
			<DialogContainer
				content={text}
				confirmButton={true}
				confirmButtonText={'OK'}
				cancelButton={true}
				cancelButtonText={cancel[this.language]}
				onConfirm={this.askForPassword}
				onCancel={() => RX.Modal.dismissAll()}
			/>
		);

		RX.Modal.show(leaveRoomConfirmation, 'leaveRoomConfirmation');
	};

	private askForPassword = () => {
		const text = (
			<RX.View>
				<RX.Text style={styles.textDialog}>{enterPassword[this.language]}</RX.Text>
				<RX.View style={[styles.inputField, { margin: OBJECT_MARGIN }]}>
					<RX.TextInput
						style={styles.inputBox}
						onChangeText={password => (this.currentPassword = password)}
						secureTextEntry={true}
						keyboardType={'default'}
						disableFullscreenUI={true}
						allowFontScaling={false}
						autoCapitalize={'none'}
						autoCorrect={false}
						autoFocus={true}
						spellCheck={false}
					/>
				</RX.View>
			</RX.View>
		);

		const passwordDialog = (
			<DialogContainer
				content={text}
				confirmButton={true}
				confirmButtonText={'OK'}
				cancelButton={true}
				cancelButtonText={cancel[this.language]}
				onConfirm={this.deleteAccount}
				onCancel={() => RX.Modal.dismissAll()}
			/>
		);

		RX.Modal.show(passwordDialog, 'passwordDialog');
	};

	private deleteAccount = async () => {
		RX.Modal.dismissAll();

		const response1 = (await ApiClient.deleteAccount().catch(async (error1: AuthResponse_) => {
			if (error1.statusCode === 401 && error1.body.flows[0].stages[0] === 'm.login.password') {
				const type = error1.body.flows[0].stages[0];
				const session = error1.body.session;

				const response2 = await ApiClient.deleteAccount(type, this.currentPassword, session).catch(
					(error2: ErrorResponse_) => {
						RX.Modal.dismissAll();

						if (error2.body.error === 'Invalid password') {
							const text = (
								<RX.Text style={styles.textDialog}>{errorInvalidPassword[this.language]}</RX.Text>
							);

							RX.Modal.show(
								<DialogContainer
									content={text}
									modalId={'errordialog'}
								/>,
								'errordialog'
							);
						}

						return Promise.resolve(error2);
					}
				);

				return Promise.resolve(response2);
			} else {
				const error3: ErrorResponse_ = {
					statusCode: 400,
					body: {
						error: 'Server Error (unknown response)',
					},
				};

				return Promise.resolve(error3);
			}
		})) as ErrorResponse_;

		if (response1.statusCode && response1.statusCode !== 200) {
			return Promise.reject(response1);
		} else {
			ApiClient.stopSync();
			ApiClient.clearNextSyncToken();
			Pushers.removeFromDevice(ApiClient.credentials).catch(_error => null);
			FileHandler.clearCacheAppFolder();
			await ApiClient.clearStorage();
			await ApiClient.storeLastUserId();
			DataStore.clearRoomSummaryList();

			this.props.showLogin();

			return Promise.resolve('ACCOUNT_DELETED');
		}
	};

	private onLayout = (layout: RX.Types.ViewOnLayoutEvent) => {
		const screenHeight = RX.UserInterface.measureWindow().height;

		this.setState({ hideDeleteButton: layout.height / screenHeight < 0.7 });
	};

	public render(): JSX.Element | null {
		const spinner = (
			<RX.View
				style={styles.spinnerContainer}
				blockPointerEvents={!this.state.showSpinner}
			>
				<Spinner isVisible={this.state.showSpinner} />
			</RX.View>
		);

		let avatar: ReactElement;
		if (!this.avatarUrl) {
			avatar = (
				<IconSvg
					source={require('../resources/svg/RI_user.json') as SvgFile}
					fillColor={AVATAR_FOREGROUND}
					height={AVATAR_MEDIUM_WIDTH / ICON_REDUCTION_FACTOR}
					width={AVATAR_MEDIUM_WIDTH / ICON_REDUCTION_FACTOR}
				/>
			);
		} else {
			avatar = (
				<CachedImage
					resizeMode={'cover'}
					style={styles.avatar}
					source={this.avatarUrl}
					animated={true}
				/>
			);
		}

		let zoomPanel: ReactElement | undefined;
		if (UiStore.getIsElectron()) {
			this.zoomFactor = this.webFrame!.getZoomFactor();

			zoomPanel = (
				<RX.View style={styles.buttonsContainer}>
					<RX.Button
						style={styles.zoomButton}
						onPress={this.zoomIn}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					>
						<RX.View style={styles.containerIcon}>
							<RX.Text
								allowFontScaling={false}
								style={styles.zoomButtonText}
							>
								+
							</RX.Text>
						</RX.View>
					</RX.Button>
					<RX.Button
						style={styles.zoomButton}
						onPress={this.zoomOut}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					>
						<RX.View style={styles.containerIcon}>
							<RX.Text
								allowFontScaling={false}
								style={styles.zoomButtonText}
							>
								−
							</RX.Text>
						</RX.View>
					</RX.Button>
					<RX.Button
						style={styles.zoomButton}
						onPress={this.zoomReset}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					>
						<RX.View style={styles.containerIcon}>
							<RX.Text
								allowFontScaling={false}
								style={styles.zoomButtonText}
							>
								⊡
							</RX.Text>
						</RX.View>
					</RX.Button>
				</RX.View>
			);
		}

		let emailSettings: ReactElement | undefined;
		if (this.emailAddress) {
			emailSettings = (
				<RX.View style={[styles.settingsContainer, { marginTop: SPACING }]}>
					<RX.View style={styles.rowContainer}>
						<RX.Text
							allowFontScaling={false}
							style={styles.label}
						>
							{emailAddress[this.language]}
						</RX.Text>

						<RX.View
							style={styles.textField}
							title={this.emailAddress}
						>
							<RX.Text
								allowFontScaling={false}
								numberOfLines={1}
								style={styles.userId}
							>
								{this.emailAddress || '_'}
							</RX.Text>
						</RX.View>
					</RX.View>

					<RX.View style={styles.rowContainer}>
						<RX.Text
							allowFontScaling={false}
							style={styles.label}
						>
							{emailNotifications[this.language]}
						</RX.Text>

						<RX.View style={styles.textField}>
							<RX.Button
								style={styles.emailCheckbox}
								onPress={this.toggleEmailNotifications}
								disableTouchOpacityAnimation={true}
								activeOpacity={1}
							>
								<RX.Text
									allowFontScaling={false}
									style={[
										styles.checkboxText,
										{ color: this.emailNotifications ? 'limegreen' : 'red' },
									]}
								>
									{this.emailNotifications ? '✓' : '✗'}
								</RX.Text>
							</RX.Button>
						</RX.View>
					</RX.View>
				</RX.View>
			);
		}

		let fileTypePicker: ReactElement | undefined;
		if (this.state.showFileTypePicker) {
			fileTypePicker = (
				<RX.View
					style={styles.fileTypeDialog}
					onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
				>
					<RX.Button
						style={styles.buttonDialog}
						onPress={this.pickAvatarPhoto}
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
							{photos[this.language]}
						</RX.Text>
					</RX.Button>
					<RX.Button
						style={styles.buttonDialog}
						onPress={this.pickAvatarFile}
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
							{files[this.language]}
						</RX.Text>
					</RX.Button>
				</RX.View>
			);
		}

		const content = (
			<RX.View style={styles.contentContainer}>
				{zoomPanel}
				<RX.View style={styles.settingsContainer}>
					<RX.View style={styles.rowContainer}>
						<RX.Text
							allowFontScaling={false}
							style={styles.label}
						>
							{userId[this.language]}
						</RX.Text>
						<RX.View
							style={styles.textField}
							title={ApiClient.credentials.userIdFull}
							onPress={this.onPressUserId}
							disableTouchOpacityAnimation={true}
							activeOpacity={1}
						>
							<RX.Text
								allowFontScaling={false}
								numberOfLines={1}
								style={styles.userId}
							>
								{ApiClient.credentials.userIdFull}
							</RX.Text>
						</RX.View>
					</RX.View>
					<RX.View style={styles.rowContainer}>
						<RX.Text
							allowFontScaling={false}
							style={styles.label}
						>
							{displayName[this.language]}
						</RX.Text>
						<RX.View style={styles.inputField}>
							<RX.TextInput
								style={styles.inputBox}
								placeholder={enterYourName[this.language]}
								placeholderTextColor={PLACEHOLDER_TEXT}
								onChangeText={this.changeDisplayName}
								value={this.displayName}
								tabIndex={1}
								keyboardType={'default'}
								disableFullscreenUI={true}
								allowFontScaling={false}
								autoCapitalize={'none'}
								autoCorrect={false}
								autoFocus={false}
								spellCheck={false}
							/>
						</RX.View>
					</RX.View>
					<RX.View style={styles.rowContainer}>
						<RX.Text
							allowFontScaling={false}
							style={styles.label}
						>
							{profilePicture[this.language]}
						</RX.Text>
						<RX.View style={styles.inputField}>
							<RX.View
								style={styles.avatarContainer}
								onPress={this.onPressAvatar}
								disableTouchOpacityAnimation={true}
								activeOpacity={1}
							>
								{avatar}
								{fileTypePicker}
							</RX.View>
						</RX.View>
					</RX.View>
					<RX.View style={styles.rowContainer}>
						<RX.Text
							allowFontScaling={false}
							style={styles.label}
						>
							{userPassword[this.language]}
						</RX.Text>
						<RX.View style={styles.inputField}>
							<RX.TextInput
								style={[styles.inputBox, { marginBottom: SPACING }]}
								placeholder={currentPassword[this.language]}
								placeholderTextColor={PLACEHOLDER_TEXT}
								onChangeText={password => (this.currentPassword = password)}
								secureTextEntry={true}
								tabIndex={2}
								keyboardType={'default'}
								disableFullscreenUI={true}
								allowFontScaling={false}
								autoCapitalize={'none'}
								autoCorrect={false}
								autoFocus={false}
								spellCheck={false}
							/>
							<RX.TextInput
								style={[styles.inputBox, { marginBottom: SPACING }]}
								placeholder={newPassword[this.language]}
								placeholderTextColor={PLACEHOLDER_TEXT}
								onChangeText={password => (this.newPassword = password)}
								secureTextEntry={true}
								tabIndex={3}
								keyboardType={'default'}
								disableFullscreenUI={true}
								allowFontScaling={false}
								autoCapitalize={'none'}
								autoCorrect={false}
								autoFocus={false}
								spellCheck={false}
							/>
							<RX.TextInput
								style={styles.inputBox}
								placeholder={repeatNewPassword[this.language]}
								placeholderTextColor={PLACEHOLDER_TEXT}
								onChangeText={this.changePassword}
								secureTextEntry={true}
								tabIndex={4}
								keyboardType={'default'}
								disableFullscreenUI={true}
								allowFontScaling={false}
								autoCapitalize={'none'}
								autoCorrect={false}
								autoFocus={false}
								spellCheck={false}
							/>
						</RX.View>
					</RX.View>
				</RX.View>
				{emailSettings}
				{spinner}
			</RX.View>
		);

		const settingsDialog = (
			<DialogContainer
				content={content}
				confirmButton={true}
				confirmButtonText={save[this.language]}
				cancelButton={true}
				cancelButtonText={close[this.language]}
				onConfirm={this.saveSettings}
				onCancel={() => RX.Modal.dismissAll()}
				confirmDisabled={this.state.confirmDisabled || this.state.offline}
				backgroundColorContent={TRANSPARENT_BACKGROUND}
				scrollEnabled={['android', 'ios'].includes(this.platform)}
			/>
		);

		let deleteAccountButton;
		if (!this.state.hideDeleteButton) {
			deleteAccountButton = (
				<RX.View style={styles.buttonDeleteContainer}>
					<RX.Button
						style={styles.buttonDelete}
						onPress={this.onPressDeleteAccount}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
						disabled={this.state.offline}
						disabledOpacity={1}
					>
						<RX.Text style={styles.buttonTextDelete}>{deleteAccount[this.language]}</RX.Text>
						<IconSvg
							source={require('../resources/svg/RI_msg_delete.json') as SvgFile}
							style={{ position: 'absolute', right: 8 }}
							fillColor={'orangered'}
							height={ICON_INFO_SIZE}
							width={ICON_INFO_SIZE}
						/>
					</RX.Button>
				</RX.View>
			);
		}

		return (
			<RX.View
				style={styles.modalScreen}
				onLayout={this.onLayout}
			>
				{settingsDialog}
				{deleteAccountButton}
			</RX.View>
		);
	}
}
