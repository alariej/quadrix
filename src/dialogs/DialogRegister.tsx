import React, { ReactElement } from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import { OPAQUE_BACKGROUND, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_MODAL_BACKGROUND, FONT_LARGE, SPACING, BUTTON_MODAL_TEXT,
    OBJECT_MARGIN, INPUT_TEXT, TRANSPARENT_BACKGROUND, BORDER_RADIUS, MODAL_CONTENT_BACKGROUND, PLACEHOLDER_TEXT } from '../ui';
import { Credentials } from '../models/Credentials';
import ReCaptcha from '../modules/ReCaptcha';
import UiStore from '../stores/UiStore';
import { userIdInUse, cancel, errorRegistration, registrationNotSupported, confirmationEmail, firstClickLink, serverRequiresEmail,
    yourEmailAddress, clientSideConfNotSupported, emailAlreadyUsed, Languages } from '../translations';
import DialogContainer from '../modules/DialogContainer';
import utils from '../utils/Utils';
import { EmailTokenResponse_, ErrorRegisterResponse_, LoginResponse_, RegisterStageType } from '../models/MatrixApi';
import Spinner from '../components/Spinner';
import AppFont from '../modules/AppFont';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: OPAQUE_BACKGROUND,
    }),
    spinnerContainer: RX.Styles.createViewStyle({
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    }),
    button: RX.Styles.createViewStyle({
        position: 'absolute',
        bottom: OBJECT_MARGIN,
        borderRadius: BUTTON_HEIGHT / 2,
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT,
        backgroundColor: BUTTON_MODAL_BACKGROUND,
    }),
    buttonText: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_LARGE,
        marginVertical: SPACING,
        textAlign: 'center',
        color: BUTTON_MODAL_TEXT,
    }),
    textDialog: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        textAlign: 'center',
        color: INPUT_TEXT,
        fontSize: FONT_LARGE,
        margin: SPACING * 2,
    }),
    inputBox: RX.Styles.createTextInputStyle({
        fontFamily: AppFont.fontFamily,
        alignSelf: 'stretch',
        fontSize: FONT_LARGE,
        paddingHorizontal: SPACING * 2,
        height: BUTTON_HEIGHT, // required for ios
        borderRadius: BORDER_RADIUS,
        backgroundColor: MODAL_CONTENT_BACKGROUND,
    }),
    emailInputMessage: RX.Styles.createViewStyle({
        backgroundColor: MODAL_CONTENT_BACKGROUND,
        marginBottom: OBJECT_MARGIN,
        borderRadius: BORDER_RADIUS,
    }),
}

interface DialogRegisterProps {
    showMainPage: () => void;
    showRegistrationError: (text: string) => void;
    userId: string;
    password: string;
    server: string;
}

interface DialogRegisterState {
    showSpinner: boolean;
    showRecaptcha: boolean;
    showTerms: boolean;
    showEmailInputDialog: boolean;
    showEmailConfirmation: boolean;
}

export default class DialogRegister extends RX.Component<DialogRegisterProps, DialogRegisterState> {

    private session = '';
    private type: RegisterStageType | undefined;
    private recaptchaKey = '';
    private recaptchaCompleted = false;
    private language: Languages = 'en';
    private nFlow = 0;
    private emailAddress = '';
    private emailInputDialog: ReactElement | null = null;
    private emailConfirmation: ReactElement | null = null;

    constructor(props: DialogRegisterProps) {
        super(props);

        this.language = UiStore.getLanguage();

        this.state = {
            showSpinner: false,
            showRecaptcha: false,
            showTerms: false,
            showEmailInputDialog: false,
            showEmailConfirmation: false,
        }
    }

    public componentDidMount(): void {

        this.registrationStart();
    }

    private registrationStart = () => {

        this.setState({ showSpinner: true, });

        ApiClient.register(this.props.userId, this.props.password, this.props.server)
            .then((response: LoginResponse_) => {
                this.login(response);
            })
            .catch((error: ErrorRegisterResponse_) => {

                if (error.statusCode === 400 && error.body.errcode === 'M_USER_IN_USE') {

                    this.props.showRegistrationError(userIdInUse[this.language]);

                } else if (error.statusCode === 401 && error.body.session) {

                    const params = error.body.params;
                    this.session = error.body.session;
                    this.type = error.body.flows[0].stages[0] as RegisterStageType;

                    switch (this.type) {

                        case 'm.login.recaptcha':
                            this.recaptchaKey = params['m.login.recaptcha'].public_key;
                            this.showRecaptcha();
                            break;

                        case 'm.login.terms':
                            // const terms = params['m.login.terms']['policies']['privacy_policy']['en'];
                            this.showTerms();
                            break;

                        case 'm.login.dummy':
                            this.loginDummy();
                            break;

                        case 'm.login.email.identity':
                            this.loginEmail().catch(() => null );
                            break;

                        default:
                            this.props.showRegistrationError(registrationNotSupported[this.language]);
                    }

                } else {
                    this.props.showRegistrationError(errorRegistration[this.language]);
                }
            });
    }

    private showRecaptcha = () => {
        this.setState({ showRecaptcha: true });
    }

    private onCompleteRecaptcha = (captchaToken: string) => {

        if (['error', 'expired'].includes(captchaToken)) { return }

        this.setState({
            showSpinner: true,
            showRecaptcha: false,
        });

        if (this.recaptchaCompleted) { return; }

        ApiClient.register(this.props.userId, this.props.password, this.props.server, this.type, this.session, captchaToken)
            .then((response: LoginResponse_) => {
                this.login(response);
            })
            .catch((error: ErrorRegisterResponse_) => {

                if (error.statusCode === 401 && error.body.session && error.body.completed[0] === 'm.login.recaptcha') {

                    this.recaptchaCompleted = true;

                    // const params = error.body.params;
                    this.type = error.body.flows[0].stages[this.nFlow + 1] as RegisterStageType;

                    this.nFlow++;

                    switch (this.type) {

                        case 'm.login.terms':
                            // const terms = params['m.login.terms']['policies']['privacy_policy']['en'];
                            this.showTerms();
                            break;

                        case 'm.login.dummy':
                            this.loginDummy();
                            break;

                        case 'm.login.email.identity':
                            this.loginEmail().catch(() => null );
                            break;

                        default:
                            this.props.showRegistrationError(registrationNotSupported[this.language]);
                    }

                } else {
                    this.props.showRegistrationError(errorRegistration[this.language]);
                }
            });
    }

    private showTerms = () => {

        // TODO: actually show terms

        ApiClient.register(this.props.userId, this.props.password, this.props.server, this.type, this.session, '')
            .then((response: LoginResponse_) => {
                this.login(response);
            })
            .catch((error: ErrorRegisterResponse_) => {

                if (error.statusCode === 401 && error.body.session && error.body.completed[0] === 'm.login.terms') {

                    this.type = error.body.flows[0].stages[this.nFlow + 1] as RegisterStageType;

                    // this.nFlow++;

                    switch (this.type) {

                        case 'm.login.dummy':
                            this.loginDummy();
                            break;

                        case 'm.login.email.identity':
                            this.loginEmail().catch(() => null );
                            break;

                        default:
                            this.props.showRegistrationError(registrationNotSupported[this.language]);
                    }
                } else {

                    this.props.showRegistrationError(errorRegistration[this.language]);
                }
            });
    }

    private loginDummy = () => {

        ApiClient.register(this.props.userId, this.props.password, this.props.server, this.type, this.session, '')
            .then((response: LoginResponse_) => {
                this.login(response);
            })
            .catch((_error: ErrorRegisterResponse_) => {
                this.props.showRegistrationError(errorRegistration[this.language]);
            });
    }

    private showEmailConfirmation = (): Promise<boolean> => {

        this.setState({ showSpinner: false });

        return new Promise(resolve => {
            const text = (
                <RX.Text style={ styles.textDialog }>
                    <RX.Text>
                        { confirmationEmail[this.language] }
                    </RX.Text>
                    <RX.Text style={{ fontWeight: 'bold' }}>
                        { this.emailAddress }
                    </RX.Text>
                    <RX.Text>
                        { firstClickLink[this.language] }
                    </RX.Text>
                </RX.Text>
            );

            this.emailConfirmation = (
                <DialogContainer
                    content={ text }
                    confirmButton={ false }
                    cancelButton={ true }
                    cancelButtonText={ 'OK' }
                    onCancel={ () => resolve(true) }
                    backgroundColor={ TRANSPARENT_BACKGROUND }
                />
            );

            this.setState({ showEmailConfirmation: true })
        });
    }

    private inputEmailAddress = (): Promise<boolean> => {

        this.setState({ showSpinner: false });

        return new Promise(resolve => {
            const content = (
                <RX.View
                    onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                    disableTouchOpacityAnimation={ true }
                >
                    <RX.View style={ styles.emailInputMessage }>
                        <RX.Text style={ styles.textDialog }>
                            { serverRequiresEmail[this.language] }
                        </RX.Text>
                    </RX.View>

                    <RX.TextInput
                        style={ styles.inputBox }
                        placeholder={ yourEmailAddress[this.language] }
                        placeholderTextColor={ PLACEHOLDER_TEXT }
                        onChangeText={ emailAddress => this.emailAddress = emailAddress }
                        keyboardType={ UiStore.getPlatform() === 'web' ? 'default' : 'email-address' }
                        disableFullscreenUI={ true }
                        allowFontScaling={ false }
                        autoCapitalize={ 'none' }
                        autoCorrect={ false }
                        autoFocus={ true }
                        spellCheck={ false }
                    />
                </RX.View>
            );

            this.emailInputDialog = (
                <DialogContainer
                    content={ content }
                    confirmButton={ true }
                    confirmButtonText={ 'OK' }
                    cancelButton={ true }
                    cancelButtonText={ cancel[this.language] }
                    onConfirm={ () => resolve(true) }
                    onCancel={ () => RX.Modal.dismissAll() }
                    backgroundColor={ TRANSPARENT_BACKGROUND }
                    backgroundColorContent={ TRANSPARENT_BACKGROUND }
                />
            );

            this.setState({ showEmailInputDialog: true })
        });
    }

    private loginEmail = async () => {

        await this.inputEmailAddress();

        this.setState({
            showEmailInputDialog: false,
            showSpinner: true,
        });

        const clientSecret = utils.getRandomString(12);
        const sendAttempt = 1;

        ApiClient.requestEmailToken(this.props.server, clientSecret, this.emailAddress, sendAttempt)
            .then(async (response: EmailTokenResponse_) => {

                if (response.submit_url) {
                    this.props.showRegistrationError(clientSideConfNotSupported[this.language]);
                } else {

                    await this.showEmailConfirmation();

                    this.setState({
                        showEmailConfirmation: false,
                        showSpinner: true,
                    });

                    const data = {
                        sid: response.sid,
                        client_secret: clientSecret,
                    }

                    ApiClient.register(this.props.userId, this.props.password, this.props.server, this.type, this.session, data)
                        .then((response: LoginResponse_) => {
                            this.login(response);
                        })
                        .catch((error: ErrorRegisterResponse_) => {
                            if (error.statusCode === 400 && error.body.errcode === 'M_THREEPID_IN_USE') {
                                this.props.showRegistrationError(emailAlreadyUsed[this.language]);
                            } else {
                                this.props.showRegistrationError(errorRegistration[this.language]);
                            }
                        });
                }
            })
            .catch(_error => {
                this.props.showRegistrationError(errorRegistration[this.language]);
            });
    }

    private login = (serverResponse: LoginResponse_) => {

        if (serverResponse.access_token) {

            const credentials: Credentials = {
                userId: this.props.userId,
                userIdFull: serverResponse.user_id,
                accessToken: serverResponse.access_token,
                deviceId: serverResponse.device_id,
                homeServer: this.props.server,
            };

            ApiClient.setCredentials(credentials);

            this.props.showMainPage();

            RX.Modal.dismissAll();

        } else {
            this.props.showRegistrationError(errorRegistration[this.language]);
        }
    }

    private hideSpinner = () => {

        if (this.state.showSpinner) {
            this.setState({ showSpinner: false });
        }
    }

    private onPressCancelButton = () => {

        RX.Modal.dismiss('dialogRegister');
    }

    public render(): JSX.Element | null {

        let recaptcha: ReactElement | null = null;
        if (this.state.showRecaptcha) {
            recaptcha = (
                <ReCaptcha
                    siteKey={ this.recaptchaKey }
                    hideSpinner={ this.hideSpinner }
                    onCompleted={ this.onCompleteRecaptcha }
                />
            );
        }

        const spinner = (
            <RX.View
                style={ styles.spinnerContainer }
                blockPointerEvents={ !this.state.showSpinner }
            >
                <Spinner isVisible={ this.state.showSpinner ? true : false } />
            </RX.View>
        );

        let cancelButton: ReactElement | null = null;
        if (this.state.showRecaptcha && !this.state.showSpinner) {
            cancelButton = (
                <RX.Button
                    style={ styles.button }
                    onPress={ this.onPressCancelButton }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    <RX.Text style={ styles.buttonText }>
                        { cancel[UiStore.getLanguage()] }
                    </RX.Text>
                </RX.Button>
            );
        }

        return (
            <RX.View style={ styles.modalScreen }>

                { spinner }

                { recaptcha }

                { this.state.showEmailInputDialog ? this.emailInputDialog : null }

                { this.state.showEmailConfirmation ? this.emailConfirmation : null }

                { cancelButton }

            </RX.View>
        );
    }
}
