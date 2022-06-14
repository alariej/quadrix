import React, { ReactElement } from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import DataStore from '../stores/DataStore';
import DialogContainer from '../modules/DialogContainer';
import FileHandler from '../modules/FileHandler';
import { save, cancel, Languages, photos, files } from '../translations';
import UiStore from '../stores/UiStore';
import { ComponentBase } from 'resub';
import {
	BUTTON_MODAL_TEXT,
	FONT_LARGE,
	BORDER_RADIUS,
	INPUT_BORDER,
	OBJECT_MARGIN,
	BUTTON_LONG_WIDTH,
	CONTAINER_PADDING,
	BUTTON_HEIGHT,
	AVATAR_BACKGROUND,
	AVATAR_LARGE_WIDTH,
	BUTTON_SHORT_WIDTH,
	BUTTON_MODAL_BACKGROUND,
	SPACING,
	OPAQUE_BACKGROUND,
	BUTTON_DISABLED_TEXT,
	DIALOG_WIDTH,
	AVATAR_FOREGROUND,
} from '../ui';
import IconSvg, { SvgFile } from '../components/IconSvg';
import { ErrorResponse_, RoomPhase, RoomType, StateEventContent_ } from '../models/MatrixApi';
import { FileObject } from '../models/FileObject';
import Spinner from '../components/Spinner';
import AppFont from '../modules/AppFont';
import CachedImage from '../modules/CachedImage';
import StringUtils from '../utils/StringUtils';

const styles = {
	modalScreen: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
	}),
	avatarContainer: RX.Styles.createViewStyle({
		justifyContent: 'center',
		alignItems: 'center',
		height: DIALOG_WIDTH - 2 * OBJECT_MARGIN,
		marginVertical: OBJECT_MARGIN,
	}),
	avatar: RX.Styles.createImageStyle({
		flex: 1,
		width: DIALOG_WIDTH - 2 * OBJECT_MARGIN,
		borderRadius: (DIALOG_WIDTH - 2 * OBJECT_MARGIN) / 2,
		overlayColor: AVATAR_BACKGROUND,
	}),
	spinnerContainer: RX.Styles.createViewStyle({
		position: 'absolute',
		height: DIALOG_WIDTH - 2 * OBJECT_MARGIN,
		justifyContent: 'center',
		alignItems: 'center',
	}),
	textDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		color: BUTTON_MODAL_TEXT,
		fontSize: FONT_LARGE,
		margin: 12,
	}),
	inputBox: RX.Styles.createTextInputStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		paddingHorizontal: CONTAINER_PADDING,
		height: BUTTON_HEIGHT,
		borderRadius: BORDER_RADIUS,
		width: BUTTON_LONG_WIDTH,
		borderWidth: 1,
		borderColor: INPUT_BORDER,
		marginTop: OBJECT_MARGIN,
		alignSelf: 'center',
	}),
	fileTypeDialog: RX.Styles.createViewStyle({
		position: 'absolute',
		top: (DIALOG_WIDTH - 2 * OBJECT_MARGIN) / 2 - BUTTON_HEIGHT - SPACING,
		left: SPACING,
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
};

interface AvatarProps extends RX.CommonProps {
	avatarUrl: string;
	roomName: string;
	roomType: RoomType;
	roomPhase: RoomPhase;
	roomId: string;
}

interface AvatarState {
	confirmDisabled: boolean;
	showSpinner: boolean;
	showFileTypePicker: boolean;
	offline: boolean;
}

export default class DialogAvatar extends ComponentBase<AvatarProps, AvatarState> {
	private powerLevel: number;
	private language: Languages = 'en';
	private avatarUrl = '';
	private avatarFile: FileObject | undefined;
	private roomName: string;
	private roomNameRemote: string;
	private canChange = false;
	private platform: RX.Types.PlatformType;
	private isMounted_: boolean | undefined;

	constructor(props: AvatarProps) {
		super(props);

		this.avatarUrl = props.avatarUrl;
		this.powerLevel = DataStore.getPowerLevel(props.roomId, ApiClient.credentials.userIdFull);
		this.language = UiStore.getLanguage();
		this.platform = UiStore.getPlatform();
		this.roomName = props.roomName;
		this.roomNameRemote = props.roomName;

		this.canChange = props.roomType !== 'direct' && props.roomPhase === 'join' && this.powerLevel === 100;
	}

	protected _buildState(_props: AvatarProps, initState: boolean): Partial<AvatarState> {
		if (initState) {
			return {
				confirmDisabled: true,
				showSpinner: false,
				showFileTypePicker: false,
				offline: UiStore.getOffline(),
			};
		}

		return { offline: UiStore.getOffline() };
	}

	public componentDidMount(): void {
		super.componentDidMount();

		this.isMounted_ = true;
	}

	public componentWillUnmount(): void {
		this.isMounted_ = false;
	}

	private setConfirmDisabled = () => {
		const confirmDisabled =
			(!this.avatarFile || !this.avatarUrl) && (!this.roomName || this.roomNameRemote === this.roomName);
		this.setState({ confirmDisabled: confirmDisabled });
	};

	private onPressAvatar = () => {
		if (!this.canChange) {
			return;
		}

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

	private saveNewValues = () => {
		RX.UserInterface.dismissKeyboard();

		this.setState({
			confirmDisabled: true,
			showSpinner: true,
		});

		Promise.all([this.saveName(), this.saveAvatar()])
			.then(_response => {
				if (this.isMounted_) {
					RX.Modal.dismissAll();
				}
			})
			.catch((error: ErrorResponse_) => {
				if (this.isMounted_) {
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

	private saveName = async (): Promise<void> => {
		if (!this.roomName || this.roomName === this.roomNameRemote) {
			return Promise.resolve();
		}

		const content = {
			name: this.roomName,
		};

		await ApiClient.sendStateEvent(this.props.roomId, 'm.room.name', content, '').catch(error => {
			return Promise.reject(error);
		});

		this.roomNameRemote = this.roomName;

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

		const content: StateEventContent_ = {
			url: response.uri,
			size: this.avatarFile.size!,
			mimetype: this.avatarFile.type,
		};

		await ApiClient.sendStateEvent(this.props.roomId, 'm.room.avatar', content, '').catch(error => {
			return Promise.reject(error);
		});

		this.avatarUrl = StringUtils.mxcToHttp(response.uri, ApiClient.credentials.homeServer);

		this.avatarFile = undefined;

		return Promise.resolve();
	};

	private changeRoomName = (roomName: string) => {
		this.roomName = roomName;

		this.setConfirmDisabled();
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
			if (this.props.roomType === 'direct') {
				avatar = (
					<IconSvg
						source={require('../resources/svg/contact.json') as SvgFile}
						fillColor={AVATAR_FOREGROUND}
						height={AVATAR_LARGE_WIDTH * 0.5}
						width={AVATAR_LARGE_WIDTH * 0.5}
					/>
				);
			} else if (this.props.roomType === 'notepad') {
				avatar = (
					<IconSvg
						source={require('../resources/svg/notepad.json') as SvgFile}
						fillColor={AVATAR_FOREGROUND}
						height={AVATAR_LARGE_WIDTH * 0.6}
						width={AVATAR_LARGE_WIDTH * 0.6}
						style={{ marginLeft: AVATAR_LARGE_WIDTH / 14, marginBottom: AVATAR_LARGE_WIDTH / 14 }}
					/>
				);
			} else if (this.props.roomType === 'group') {
				avatar = (
					<IconSvg
						source={require('../resources/svg/group.json') as SvgFile}
						fillColor={AVATAR_FOREGROUND}
						height={AVATAR_LARGE_WIDTH * 0.7}
						width={AVATAR_LARGE_WIDTH * 0.7}
					/>
				);
			} else if (this.props.roomType === 'community') {
				avatar = (
					<IconSvg
						source={require('../resources/svg/community.json') as SvgFile}
						fillColor={AVATAR_FOREGROUND}
						height={AVATAR_LARGE_WIDTH * 0.6}
						width={AVATAR_LARGE_WIDTH * 0.6}
					/>
				);
			}
		} else {
			avatar = (
				<CachedImage
					resizeMode={'cover'}
					style={styles.avatar}
					source={this.avatarUrl}
				/>
			);
		}

		let roomName;
		if (this.canChange) {
			roomName = (
				<RX.TextInput
					style={styles.inputBox}
					onChangeText={text => this.changeRoomName(text)}
					value={this.roomName}
					tabIndex={1}
					editable={this.canChange}
					keyboardType={'default'}
					disableFullscreenUI={true}
					allowFontScaling={false}
					autoCapitalize={'none'}
					autoCorrect={false}
					autoFocus={false}
					spellCheck={false}
				/>
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
			<RX.View>
				{roomName}
				<RX.View
					style={[styles.avatarContainer, { cursor: this.canChange ? 'pointer' : 'default' }]}
					onPress={this.onPressAvatar}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					{avatar!}
					{spinner}
					{fileTypePicker}
				</RX.View>
			</RX.View>
		);

		const dialogAvatar = (
			<DialogContainer
				content={content}
				confirmButton={this.canChange}
				confirmButtonText={save[this.language]}
				cancelButton={this.canChange}
				cancelButtonText={cancel[this.language]}
				onConfirm={this.saveNewValues}
				onCancel={() => RX.Modal.dismissAll()}
				confirmDisabled={this.state.confirmDisabled || this.state.offline}
			/>
		);

		return <RX.View style={styles.modalScreen}>{dialogAvatar}</RX.View>;
	}
}
