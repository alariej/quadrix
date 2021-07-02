import React from 'react';
import RX from 'reactxp';
import { BUTTON_LONG_BACKGROUND, BUTTON_MODAL_BACKGROUND, BUTTON_LONG_TEXT, INPUT_BACKGROUND, HEADER_TEXT,
    MODAL_CONTENT_TEXT, BORDER_RADIUS, CONTAINER_PADDING, BUTTON_LONG_WIDTH, FONT_LARGE, SPACING, BUTTON_HEIGHT, LOGO_BACKGROUND,
    OBJECT_MARGIN, PLACEHOLDER_TEXT, TRANSPARENT_BACKGROUND } from '../ui';
import ApiClient from '../matrix/ApiClient';
import ModalSpinner from '../components/ModalSpinner';
import DialogContainer from '../modules/DialogContainer';
import DialogRegister from '../dialogs/DialogRegister';
import RXNetInfo from 'reactxp-netinfo';
import UiStore from '../stores/UiStore';
import { haveAnAccount, noAccount, register, login, userPassword, repeatPassword, server, userServer, userId, passwordNoMatch,
    userIdPasswordMissing, errorInvalidPassword, Languages } from '../translations';
import IconSvg, { SvgFile } from '../components/IconSvg';
import { ErrorResponse_ } from '../models/MatrixApi';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
    }),
    containerDialog: RX.Styles.createViewStyle({
        alignItems: 'center',
        overflow: 'visible',
    }),
    logo: RX.Styles.createImageStyle({
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        borderRadius: 12,
        marginBottom: 1.5 * OBJECT_MARGIN,
        backgroundColor: LOGO_BACKGROUND,
    }),
    containerUserInput: RX.Styles.createViewStyle({
        overflow: 'visible',
    }),
    inputBox: RX.Styles.createTextInputStyle({
        fontSize: FONT_LARGE,
        paddingHorizontal: CONTAINER_PADDING,
        width: BUTTON_LONG_WIDTH,
        height: BUTTON_HEIGHT,
        borderRadius: BORDER_RADIUS,
        marginBottom: OBJECT_MARGIN,
        backgroundColor: INPUT_BACKGROUND,
    }),
    mainButton: RX.Styles.createViewStyle({
        width: BUTTON_LONG_WIDTH,
        height: BUTTON_HEIGHT,
        borderRadius: BUTTON_HEIGHT / 2,
        backgroundColor: BUTTON_LONG_BACKGROUND,
    }),
    mainButtonText: RX.Styles.createTextStyle({
        fontSize: FONT_LARGE,
        textAlign: 'center',
        color: BUTTON_LONG_TEXT,
    }),
    registerText: RX.Styles.createTextStyle({
        textAlign: 'center',
        fontSize: FONT_LARGE,
        color: HEADER_TEXT,
        width: BUTTON_LONG_WIDTH,
        paddingVertical: SPACING,
    }),
    expandButton: RX.Styles.createViewStyle({
        position: 'absolute',
        width: BUTTON_HEIGHT,
        height: BUTTON_HEIGHT,
        left: BUTTON_LONG_WIDTH,
        alignContent: 'center',
        alignItems: 'center',
    }),
    errorDialog: RX.Styles.createTextStyle({
        textAlign: 'center',
        color: MODAL_CONTENT_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
};

interface LoginProps extends RX.CommonProps {
    showMainPage: () => void;
}

interface LoginState {
    offline: boolean;
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
            offline: false,
            loginExpanded: false,
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
                    this.userId = lastUserId;
                    this.setState({ userId: this.userId });
                    this.passwordInput!.focus();
                }
            })
            .catch(_error => null);

        RXNetInfo.isConnected()
            .then(isConnected => {
                this.setState({ offline: !isConnected });
            })
            .catch(_error => null);

        RXNetInfo.connectivityChangedEvent
            .subscribe(isConnected => {
                this.setState({ offline: !isConnected });
            });
    }

    public componentWillUnmount(): void {

        RXNetInfo.connectivityChangedEvent
            .unsubscribe(() => null);
    }

    private onPressMainButton = () => {

        if (!this.userId || !this.password) {

            const text = (
                <RX.Text style={ styles.errorDialog }>
                    { userIdPasswordMissing[this.language] }
                </RX.Text>
            );

            RX.Modal.show(<DialogContainer content={ text }/>, 'modaldialog');

            return;
        }

        RX.Modal.show(<ModalSpinner/>, 'modalspinner');

        if (!this.state.register) {

            let userId: string;
            let server: string;

            if (!this.state.loginExpanded) {

                const userIdInput = this.userId;
                const a = userIdInput.indexOf('@');
                const b = userIdInput.lastIndexOf(':');

                userId = userIdInput.substr(a + 1, b - a - 1);
                server = userIdInput.substr(b - a + 1);

            } else {

                userId = this.userId;
                server = this.server;
            }

            ApiClient.login(userId, this.password, server)
                .then(_response => {

                    RX.Modal.dismiss('modalspinner');
                    this.props.showMainPage();
                })
                .catch((error: ErrorResponse_) => {

                    RX.Modal.dismiss('modalspinner');

                    let errorText: string;
                    if (error && error.body && error.body.error) {

                        if (error.body.error === 'Invalid password') {
                            errorText = errorInvalidPassword[this.language];
                        } else {
                            errorText = error.body.error;
                        }

                    } else {
                        errorText = '[unknown error]';
                    }

                    const text = (
                        <RX.Text style={ styles.errorDialog }>
                            { errorText }
                        </RX.Text>
                    );

                    RX.Modal.show(<DialogContainer content={ text }/>, 'modaldialog');
                });

        } else {

            if (this.password === this.repeatPassword) {

                RX.Modal.dismiss('modalspinner');

                if (!this.server && this.state.server) {
                    this.server = this.state.server;
                }

                const dialogRegister =(
                    <DialogRegister
                        showMainPage={ this.props.showMainPage }
                        showRegistrationError={ this.showRegistrationError }
                        userId={ this.userId }
                        server={ this.server }
                        password={ this.password }
                    />
                );

                RX.Modal.show(dialogRegister, 'dialogRegister');

            } else {

                this.setState({ repeatPassword: '' });

                const errorDialog = (
                    <RX.Text style={ styles.errorDialog }>
                        { passwordNoMatch[this.language] }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ errorDialog }/>, 'errorDialog');
            }
        }
    }

    private showRegistrationError = (error: string) => {

        RX.Modal.dismiss('dialogRegister');

        // TODO: translate?
        const errorDialog = (
            <RX.Text style={ styles.errorDialog }>
                { error || '[unknown error]' }
            </RX.Text>
        );

        RX.Modal.show(<DialogContainer content={ errorDialog }/>, 'errorDialog');
    }

    private onKeyPress = (event: RX.Types.KeyboardEvent) => {

        if (event.keyCode === 13) { this.onPressMainButton(); }
    }

    private toggleLoginExpanded = () => {

        if (this.userId && !this.state.loginExpanded) {

            const userIdInput = this.userId;
            const a = userIdInput.indexOf('@');
            const b = userIdInput.lastIndexOf(':');

            if (a > -1 && b > 0) {

                this.userId = userIdInput.substr(a + 1, b - a - 1);
                this.server = userIdInput.substr(b - a + 1);

                this.setState({ userId: this.userId, server: this.server });
            }

        } else if (this.userId && this.server) {
            this.userId = '@' + this.userId + ':' + this.server;
            this.setState({ userId: this.userId });
        }

        this.setState({ loginExpanded: !this.state.loginExpanded });
    }

    private toggleRegister = () => {

        if (this.userId && !this.state.register) {

            this.setState({ userId: '', server: '' });
            this.userIdInput!.focus();

        } else {

            this.setState({ userId: this.userId, loginExpanded: false });
            this.passwordInput!.focus();
        }

        this.setState({ register: !this.state.register });
    }

    public render(): JSX.Element | null {

        const userIdInput = (
            <RX.TextInput
                style={ styles.inputBox }
                ref={ component => this.userIdInput = component! }
                placeholder={ this.state.loginExpanded || this.state.register ? userId[this.language] : userServer[this.language] }
                placeholderTextColor={ PLACEHOLDER_TEXT }
                onChangeText={ userId => this.userId = userId }
                disableFullscreenUI={ true }
                autoCapitalize={ 'none' }
                onKeyPress={ () => this.setState({ userId: undefined })}
                value={ this.state.userId }
                keyboardType={ UiStore.getPlatform() === 'android' ? 'email-address' : 'default' }
                autoCorrect={ false }
                tabIndex={ 1 }
                autoFocus={ true }
            />
        );

        const loginExpandedButton = (
            <RX.Button
                style={ styles.expandButton }
                onPress={ this.toggleLoginExpanded }
                disableTouchOpacityAnimation={ true }
                activeOpacity={ 1 }
                tabIndex={ -1 }
            >
                <IconSvg
                    source= { require('../resources/svg/menu.json') as SvgFile }
                    fillColor={ BUTTON_MODAL_BACKGROUND }
                    height={ 17 }
                    width={ 4 }
                />
            </RX.Button>
        );

        const serverInput = (
            <RX.View style={ styles.containerUserInput }>
                <RX.TextInput
                    style={ styles.inputBox }
                    placeholder={ server[this.language] }
                    placeholderTextColor={ PLACEHOLDER_TEXT }
                    onChangeText={ server => this.server = server }
                    disableFullscreenUI={ true }
                    autoCapitalize={ 'none' }
                    onKeyPress={ () => this.setState({ server: undefined })}
                    value={ this.state.server }
                    keyboardType={ 'default' }
                    autoCorrect={ false }
                    tabIndex={ 2 }
                />

            </RX.View>
        );

        const repeatPasswordInput = (
            <RX.TextInput
                style={ styles.inputBox }
                placeholder={ repeatPassword[this.language] }
                placeholderTextColor={ PLACEHOLDER_TEXT }
                onChangeText={ password => this.repeatPassword = password }
                disableFullscreenUI={ true }
                secureTextEntry={ true }
                autoCapitalize={ 'none' }
                keyboardType={ 'default' }
                autoCorrect={ false }
                tabIndex={ 4 }
            />
        );

        const content = (
            <RX.View style={ styles.containerDialog }>
                <RX.View style={ styles.logo }>
                    <IconSvg
                        source= { require('../resources/svg/logo.json') as SvgFile }
                        height={ 32 }
                        width={ 32 }
                        fillColor={ 'white' }
                    />
                </RX.View>
                <RX.View style={ styles.containerUserInput }>

                    { userIdInput }

                    { this.state.loginExpanded || this.state.register ? serverInput : null }

                    { this.state.register ? null : loginExpandedButton }

                </RX.View>
                <RX.TextInput
                    style={ styles.inputBox }
                    ref={ component => this.passwordInput = component! }
                    placeholder={ userPassword[this.language] }
                    placeholderTextColor={ PLACEHOLDER_TEXT }
                    onChangeText={ password => this.password = password }
                    disableFullscreenUI={ true }
                    secureTextEntry={ true }
                    autoCapitalize={ 'none' }
                    keyboardType={ 'default' }
                    autoCorrect={ false }
                    tabIndex={ 3 }
                />

                { this.state.register ? repeatPasswordInput : null }

            </RX.View>
        );

        const bottomElement = (
            <RX.Text
                style={ styles.registerText }
                onPress={ this.toggleRegister }
            >
                { this.state.register ? haveAnAccount[this.language] : noAccount[this.language] }
            </RX.Text>
        );

        const loginDialog = (
            <DialogContainer
                content={ content }
                cancelButton={ true }
                cancelButtonText={ this.state.register ? register[this.language] : login[this.language] }
                onCancel={ this.onPressMainButton }
                backgroundColor={ 'transparent' }
                backgroundColorContent={ TRANSPARENT_BACKGROUND }
                bottomElement={ bottomElement }
                buttonStyle={ styles.mainButton }
                buttonTextStyle={ styles.mainButtonText }
                scrollEnabled={ UiStore.getPlatform() === 'android' }
            />
        );

        return (
            <RX.View
                style={ styles.container }
                onKeyPress={ this.onKeyPress }
            >
                { loginDialog }
            </RX.View>
        );
    }
}
