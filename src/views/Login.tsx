import React from 'react';
import RX from 'reactxp';
import {
	BUTTON_LONG_BACKGROUND,
	BUTTON_LONG_TEXT,
	INPUT_BACKGROUND,
	HEADER_TEXT,
	MODAL_CONTENT_TEXT,
	BORDER_RADIUS,
	CONTAINER_PADDING,
	BUTTON_LONG_WIDTH,
	FONT_LARGE,
	SPACING,
	BUTTON_HEIGHT,
	OBJECT_MARGIN,
	PLACEHOLDER_TEXT,
	TRANSPARENT_BACKGROUND,
	FONT_NORMAL,
	LINK_TEXT,
	BUTTON_LOGIN_INFO,
	LOGO_FILL,
	LABEL_TEXT,
	CONTENT_BACKGROUND,
} from '../ui';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import DialogRegister from '../dialogs/DialogRegister';
import UiStore from '../stores/UiStore';
import {
	haveAnAccount,
	noAccount,
	register,
	login,
	userPassword,
	repeatPassword,
	server,
	userServer,
	userId,
	passwordNoMatch,
	userIdPasswordMissing,
	errorInvalidPassword,
	Languages,
	termsPrivacyLicense,
	deviceOfflineLogin,
	serverInfo_1,
	serverInfo_2,
	serverInfo_3,
	serverInfo_4,
	serverInfo_5,
} from '../translations';
import IconSvg, { SvgFile } from '../components/IconSvg';
import { ErrorResponse_ } from '../models/MatrixApi';
import { TERMS_URL } from '../appconfig';
import SpinnerUtils from '../utils/SpinnerUtils';
import AppFont from '../modules/AppFont';
import StringUtils from '../utils/StringUtils';
import NetInfo from '../modules/NetInfo';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		backgroundColor: CONTENT_BACKGROUND,
	}),
	containerDialog: RX.Styles.createViewStyle({
		alignItems: 'center',
		overflow: 'visible',
	}),
	logo: RX.Styles.createImageStyle({
		flex: 1,
		marginBottom: 1.5 * OBJECT_MARGIN,
	}),
	containerUserInput: RX.Styles.createViewStyle({
		overflow: 'visible',
	}),
	inputBox: RX.Styles.createTextInputStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		paddingHorizontal: CONTAINER_PADDING,
		width: BUTTON_LONG_WIDTH,
		height: BUTTON_HEIGHT,
		borderRadius: BORDER_RADIUS,
		marginBottom: 1,
		backgroundColor: INPUT_BACKGROUND,
	}),
	mainButton: RX.Styles.createViewStyle({
		width: BUTTON_LONG_WIDTH,
		height: BUTTON_HEIGHT,
		borderRadius: BUTTON_HEIGHT / 2,
		backgroundColor: BUTTON_LONG_BACKGROUND,
	}),
	mainButtonText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		textAlign: 'center',
		color: BUTTON_LONG_TEXT,
	}),
	registerText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		fontSize: FONT_LARGE,
		color: LABEL_TEXT,
		width: BUTTON_LONG_WIDTH,
		paddingVertical: SPACING,
	}),
	expandButton: RX.Styles.createViewStyle({
		position: 'absolute',
		width: BUTTON_LOGIN_INFO,
		height: 32,
		top: -(32 - BUTTON_HEIGHT) / 2,
		left: BUTTON_LONG_WIDTH,
		alignContent: 'center',
		alignItems: 'center',
	}),
	serverInfoButton: RX.Styles.createViewStyle({
		position: 'absolute',
		width: BUTTON_LOGIN_INFO,
		height: 32,
		top: BUTTON_HEIGHT + SPACING - (32 - BUTTON_HEIGHT) / 2,
		left: BUTTON_LONG_WIDTH,
		alignContent: 'center',
		alignItems: 'center',
	}),
	errorDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		color: MODAL_CONTENT_TEXT,
		fontSize: FONT_LARGE,
		margin: 12,
	}),
	terms: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: HEADER_TEXT,
		textDecorationLine: 'underline',
		textAlign: 'center',
		padding: 12,
		backgroundColor: TRANSPARENT_BACKGROUND,
	}),
	serverInfoDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		textAlign: 'center',
		color: MODAL_CONTENT_TEXT,
		margin: 12,
	}),
	url: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		color: LINK_TEXT,
		textDecorationLine: 'underline',
	}),
};

interface LoginProps extends RX.CommonProps {
	showMainPage: () => void;
}

interface LoginState {
	loginExpanded: boolean;
	register: boolean;
	repeatPassword: string;
	server: string | undefined;
	userId: string | undefined;
}

export default class Login extends RX.Component<LoginProps, LoginState> {
	private userId = '';
	private server = '';
	private password = '';
	private repeatPassword = '';
	private language: Languages = 'en';
	private passwordInput!: RX.TextInput | undefined;
	private userIdInput: RX.TextInput | undefined;

	constructor(props: LoginProps) {
		super(props);

		this.language = UiStore.getLanguage();

		this.state = {
			repeatPassword: '',
			loginExpanded: true,
			register: false,
			server: '',
			userId: '',
		};
	}

	public componentDidMount(): void {
		RX.Modal.dismissAll();

		ApiClient.getStoredLastUserId()
			.then(lastUserId => {
				if (lastUserId) {
					const userId = StringUtils.parseUserId(lastUserId);

					this.userId = userId.user;
					this.server = userId.server;

					this.setState({ userId: this.userId, server: this.server });

					UiStore.getDevice() === 'desktop' ? this.passwordInput!.focus() : null;
				}
			})
			.catch(_error => null);
	}

	private onPressMainButton = async () => {
		RX.UserInterface.dismissKeyboard();

		const isOnline = await NetInfo.isConnected().catch(_error => null);

		if (!isOnline) {
			const text = <RX.Text style={styles.errorDialog}>{deviceOfflineLogin[this.language]}</RX.Text>;

			RX.Modal.show(<DialogContainer content={text} />, 'modaldialog');

			return;
		}

		if (!this.userId || !this.password) {
			const text = <RX.Text style={styles.errorDialog}>{userIdPasswordMissing[this.language]}</RX.Text>;

			RX.Modal.show(<DialogContainer content={text} />, 'modaldialog');

			return;
		}

		SpinnerUtils.showModalSpinner('loginspinner');

		if (!this.state.register) {
			let user: string;
			let server: string;

			if (!this.state.loginExpanded) {
				const userId = StringUtils.parseUserId(this.userId);

				user = userId.user;
				server = userId.server;
			} else {
				user = this.userId.trim();
				server = this.server.trim();
			}

			ApiClient.login(user, this.password, StringUtils.cleanServerName(server))
				.then(_response => {
					SpinnerUtils.dismissModalSpinner('loginspinner');

					this.props.showMainPage();
				})
				.catch((error: ErrorResponse_) => {
					RX.Modal.dismiss('loginspinner');

					let errorText: string;
					if (error && error.body && error.body.error) {
						if (error.body.error === 'Invalid password') {
							errorText = errorInvalidPassword[this.language];
						} else {
							errorText = error.body.error;
						}
					} else if (error.statusText) {
						errorText = error.statusText;
					} else {
						errorText = '[unknown error]';
					}

					const text = <RX.Text style={styles.errorDialog}>{errorText}</RX.Text>;

					RX.Modal.show(<DialogContainer content={text} />, 'modaldialog');
				});
		} else {
			if (this.password === this.repeatPassword) {
				RX.Modal.dismiss('loginspinner');

				if (!this.server && this.state.server) {
					this.server = this.state.server;
				}

				const dialogRegister = (
					<DialogRegister
						showMainPage={this.props.showMainPage}
						showRegistrationError={this.showRegistrationError}
						userId={this.userId}
						server={StringUtils.cleanServerName(this.server)}
						password={this.password}
					/>
				);

				RX.Modal.show(dialogRegister, 'dialogRegister');
			} else {
				this.setState({ repeatPassword: '' });

				const errorDialog = <RX.Text style={styles.errorDialog}>{passwordNoMatch[this.language]}</RX.Text>;

				RX.Modal.show(<DialogContainer content={errorDialog} />, 'errorDialog');
			}
		}
	};

	private showRegistrationError = (error: string) => {
		RX.Modal.dismiss('dialogRegister');

		// TODO: translate?
		const errorDialog = <RX.Text style={styles.errorDialog}>{error || '[unknown error]'}</RX.Text>;

		RX.Modal.show(<DialogContainer content={errorDialog} />, 'errorDialog');
	};

	private onKeyPress = (event: RX.Types.KeyboardEvent) => {
		if (event.keyCode === 13) {
			this.onPressMainButton().catch(_error => null);
		}
	};

	private toggleLoginExpanded = () => {
		if (this.userId && !this.state.loginExpanded) {
			const userId = StringUtils.parseUserId(this.userId);

			this.userId = userId.user;
			this.server = userId.server;

			this.setState({ userId: this.userId, server: this.server });
		} else if (this.userId && this.server) {
			this.userId = '@' + this.userId + ':' + this.server;
			this.setState({ userId: this.userId });
		}

		this.setState({ loginExpanded: !this.state.loginExpanded });
	};

	private toggleRegister = () => {
		if (this.userId && !this.state.register) {
			this.setState({ userId: '', server: '' });
			UiStore.getDevice() === 'desktop' ? this.userIdInput!.focus() : null;
		} else {
			this.setState({ userId: this.userId, server: this.server, loginExpanded: true });
			UiStore.getDevice() === 'desktop' ? this.passwordInput!.focus() : null;
		}

		this.setState({ register: !this.state.register });
	};

	private openUrl = (url: string, event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		if (UiStore.getIsElectron()) {
			const { shell } = window.require('electron');
			shell.openExternal(url).catch(_error => null);
		} else {
			RX.Linking.openUrl(url).catch(_error => null);
		}
	};

	private showServerInfo = () => {
		const text = (
			<RX.Text style={styles.serverInfoDialog}>
				<RX.Text>{serverInfo_1[this.language]}</RX.Text>
				<RX.Text style={{ fontStyle: 'italic' }}>https://myserver.domain{'\n\n'}</RX.Text>
				<RX.Text>{serverInfo_2[this.language]}</RX.Text>
				<RX.Text style={{ fontStyle: 'italic' }}>myserver.domain{'\n\n'}</RX.Text>
				<RX.Text>{serverInfo_3[this.language]}</RX.Text>
				<RX.Text style={{ fontWeight: 'bold' }}>{serverInfo_4[this.language]}</RX.Text>
				<RX.Text>{serverInfo_5[this.language]}</RX.Text>
				<RX.Text
					style={styles.url}
					onPress={event => this.openUrl('https://joinmatrix.org/servers/', event)}
				>
					https://joinmatrix.org/servers/
				</RX.Text>
			</RX.Text>
		);

		const serverInfo = <DialogContainer content={text} />;

		RX.Modal.show(serverInfo, 'serverInfoDialog');
	};

	public render(): JSX.Element | null {
		const userIdInput = (
			<RX.TextInput
				style={styles.inputBox}
				ref={component => (this.userIdInput = component!)}
				placeholder={
					this.state.loginExpanded || this.state.register ? userId[this.language] : userServer[this.language]
				}
				placeholderTextColor={PLACEHOLDER_TEXT}
				onChangeText={userId => (this.userId = userId)}
				onKeyPress={() => this.setState({ userId: undefined })}
				value={this.state.userId}
				tabIndex={1}
				keyboardType={UiStore.getPlatform() === 'android' ? 'email-address' : 'default'}
				disableFullscreenUI={true}
				allowFontScaling={false}
				autoCapitalize={'none'}
				autoCorrect={false}
				autoFocus={UiStore.getDevice() === 'desktop' ? true : false}
				spellCheck={false}
			/>
		);

		const loginExpandedButton = (
			<RX.Button
				style={styles.expandButton}
				onPress={this.toggleLoginExpanded}
				disableTouchOpacityAnimation={true}
				activeOpacity={1}
				tabIndex={-1}
			>
				<IconSvg
					source={require('../resources/svg/RI_expand.json') as SvgFile}
					fillColor={LABEL_TEXT}
					height={20}
					width={20}
				/>
			</RX.Button>
		);

		const registerServerInfoButton = (
			<RX.Button
				style={styles.serverInfoButton}
				onPress={this.showServerInfo}
				disableTouchOpacityAnimation={true}
				activeOpacity={1}
				tabIndex={-1}
			>
				<IconSvg
					source={require('../resources/svg/RI_info.json') as SvgFile}
					fillColor={LABEL_TEXT}
					height={20}
					width={20}
				/>
			</RX.Button>
		);

		const serverInput = (
			<RX.View style={styles.containerUserInput}>
				<RX.TextInput
					style={styles.inputBox}
					placeholder={server[this.language]}
					placeholderTextColor={PLACEHOLDER_TEXT}
					onChangeText={server => (this.server = server)}
					onKeyPress={() => this.setState({ server: undefined })}
					value={this.state.server}
					tabIndex={2}
					keyboardType={'default'}
					disableFullscreenUI={true}
					allowFontScaling={false}
					autoCapitalize={'none'}
					autoCorrect={false}
					spellCheck={false}
				/>
			</RX.View>
		);

		const repeatPasswordInput = (
			<RX.TextInput
				style={styles.inputBox}
				placeholder={repeatPassword[this.language]}
				placeholderTextColor={PLACEHOLDER_TEXT}
				onChangeText={password => (this.repeatPassword = password)}
				secureTextEntry={true}
				tabIndex={4}
				keyboardType={'default'}
				disableFullscreenUI={true}
				allowFontScaling={false}
				autoCapitalize={'none'}
				autoCorrect={false}
				spellCheck={false}
			/>
		);

		const content = (
			<RX.View style={styles.containerDialog}>
				<RX.View style={styles.logo}>
					<IconSvg
						source={require('../resources/svg/logo.json') as SvgFile}
						height={72}
						width={72}
						fillColor={LOGO_FILL}
					/>
				</RX.View>
				<RX.View style={styles.containerUserInput}>
					{userIdInput}
					{this.state.loginExpanded || this.state.register ? serverInput : null}
					{this.state.register ? registerServerInfoButton : loginExpandedButton}
				</RX.View>
				<RX.TextInput
					style={styles.inputBox}
					ref={component => (this.passwordInput = component!)}
					placeholder={userPassword[this.language]}
					placeholderTextColor={PLACEHOLDER_TEXT}
					onChangeText={password => (this.password = password)}
					secureTextEntry={true}
					tabIndex={3}
					keyboardType={'default'}
					disableFullscreenUI={true}
					allowFontScaling={false}
					autoCapitalize={'none'}
					autoCorrect={false}
					spellCheck={false}
				/>

				{this.state.register ? repeatPasswordInput : null}
			</RX.View>
		);

		const bottomElement = (
			<RX.Text
				style={styles.registerText}
				onPress={this.toggleRegister}
			>
				{this.state.register ? haveAnAccount[this.language] : noAccount[this.language]}
			</RX.Text>
		);

		const loginDialog = (
			<DialogContainer
				content={content}
				cancelButton={true}
				cancelButtonText={this.state.register ? register[this.language] : login[this.language]}
				onCancel={this.onPressMainButton}
				backgroundColor={TRANSPARENT_BACKGROUND}
				backgroundColorContent={TRANSPARENT_BACKGROUND}
				bottomElement={bottomElement}
				buttonStyle={styles.mainButton}
				buttonTextStyle={styles.mainButtonText}
				scrollEnabled={UiStore.getPlatform() === 'android'}
				noButtonIcon={true}
			/>
		);

		return (
			<RX.View
				style={styles.container}
				onKeyPress={this.onKeyPress}
			>
				<RX.View style={{ flex: 1 }}>{loginDialog}</RX.View>
				<RX.View>
					<RX.Text
						style={styles.terms}
						onPress={event => this.openUrl(TERMS_URL, event)}
					>
						{termsPrivacyLicense[this.language]}
					</RX.Text>
				</RX.View>
			</RX.View>
		);
	}
}
