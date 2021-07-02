import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { LOGO_BACKGROUND, INPUT_BORDER, MODAL_CONTENT_TEXT, BORDER_RADIUS, SPACING, FONT_LARGE, FONT_NORMAL, CONTAINER_PADDING,
    BUTTON_HEIGHT, TRANSPARENT_BACKGROUND, MODAL_CONTENT_BACKGROUND, BUTTON_ROUND_BACKGROUND,
    PLACEHOLDER_TEXT, AVATAR_BACKGROUND, BUTTON_MODAL_TEXT, AVATAR_MEDIUM_WIDTH, CHECKBOX_BACKGROUND, DIALOG_WIDTH,
    APP_BACKGROUND, TILE_MESSAGE_TEXT, COMPOSER_BORDER} from '../ui';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import utils from '../utils/Utils';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import FileHandler from '../modules/FileHandler';
import { newPasswordNoMatch, passwordChanged, displayName, enterYourName, profilePicture, userPassword, currentPassword, newPassword,
    repeatNewPassword, close, save, userId, emailAddress, emailNotifications, Languages } from '../translations';
import IconSvg, { SvgFile } from '../components/IconSvg';
import { AuthResponse_, ErrorResponse_ } from '../models/MatrixApi';
import { FileObject } from '../models/FileObject';
import DataStore from '../stores/DataStore';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
    }),
    contentContainer:  RX.Styles.createViewStyle({
        alignSelf: 'stretch',
    }),
    zoomContainer:  RX.Styles.createViewStyle({
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
    colorButton: RX.Styles.createViewStyle({
        width: (DIALOG_WIDTH - 5 * SPACING) / 6,
        height: BUTTON_HEIGHT,
        borderRadius: BORDER_RADIUS,
        borderWidth: 1,
        borderColor: COMPOSER_BORDER,
    }),
    containerIcon: RX.Styles.createViewStyle({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    zoomButtonText: RX.Styles.createTextStyle({
        fontSize: 24,
        color: TILE_MESSAGE_TEXT,
    }),
    settingsContainer:  RX.Styles.createViewStyle({
        padding: SPACING,
        paddingTop: 2 * SPACING,
        borderRadius: BORDER_RADIUS,
        backgroundColor: MODAL_CONTENT_BACKGROUND,
    }),
    spinnerContainer: RX.Styles.createViewStyle({
        position: 'absolute',
        left:0,
        right:0,
        top:0,
        bottom:0,
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
        fontSize: FONT_NORMAL,
        width: 96,
    }),
    inputBox: RX.Styles.createTextInputStyle({
        fontSize: FONT_NORMAL,
        paddingHorizontal: CONTAINER_PADDING,
        height: BUTTON_HEIGHT,
        borderRadius: BORDER_RADIUS,
        borderWidth: 1,
        borderColor: INPUT_BORDER,
    }),
    userId: RX.Styles.createTextInputStyle({
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
    }),
    textDialog: RX.Styles.createTextStyle({
        textAlign: 'center',
        color: MODAL_CONTENT_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
    emailCheckbox: RX.Styles.createButtonStyle({
        height: BUTTON_HEIGHT,
        width: BUTTON_HEIGHT,
        backgroundColor: CHECKBOX_BACKGROUND,
        borderRadius: BORDER_RADIUS
    }),
    checkboxText: RX.Styles.createTextStyle({
        alignSelf: 'center',
        fontWeight: 'bold',
        fontSize: 20,
    }),
};

interface DialogSettingsState {
    confirmDisabled: boolean;
    showSpinner: boolean;
    offline: boolean;
    appColor: string;
}

export default class DialogSettings extends ComponentBase<unknown, DialogSettingsState> {

    private displayName = '';
    private displayNameRemote = '';
    private avatarUrl = '';
    private avatarFile: FileObject | undefined;
    private currentPassword = '';
    private newPassword = '';
    private repeatNewPassword = '';
    private language: Languages;
    private webFrame;
    private zoomFactor = 1;
    private emailAddress = '';
    private emailNotifications = false;
    private emailNotificationsRemote = false;
    private nClicks = 0;

    constructor(props: unknown) {
        super(props);

        this.language = UiStore.getLanguage();
        this.webFrame = UiStore.getIsElectron() ? window.require('electron').webFrame : null;
    }

    protected _buildState(_props: unknown, initState: boolean): Partial<DialogSettingsState> {

        if (initState) {
            return {
                confirmDisabled: true,
                showSpinner: true,
                offline: UiStore.getOffline(),
            }
        }

        return { offline: UiStore.getOffline() };
    }

    public componentDidMount(): void {
        super.componentDidMount();

        Promise.all([this.getUserProfile(), this.get3Pid(), this.getEmailPusher()])
            .then(_response => {

                this.setState({ showSpinner: false });

            }, (error: ErrorResponse_) => {

                this.setState({ showSpinner: false });

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { error.body && error.body.error ? error.body.error : '[Unknown error]' }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
            })
            .catch((error: ErrorResponse_) => {

                this.setState({ showSpinner: false });

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { error.body && error.body.error ? error.body.error : '[Unknown error]' }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
            });

        this.setState({ appColor: UiStore.getAppColor() });

        if (__DEV__) {

            ApiClient.getPushRules()
                .then(response => {
                    console.log('PUSH RULES:');
                    console.log(response);
                    console.log('PUSH RULES - ROOMS:');
                    const roomsAction: { roomName: string | undefined; action: string; }[] = [];
                    response.room.map(room => {
                        const roomAction = {
                            roomName: DataStore.getRoomName(room.rule_id),
                            action: room.actions[0],
                        }
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

    private getUserProfile = async (): Promise<void> => {

        const response = await ApiClient.getUserProfile(ApiClient.credentials.userIdFull)
            .catch(error => { return Promise.reject(error) });

        if (response.displayname === ApiClient.credentials.userId) {
            this.displayName = '';
        } else {
            this.displayName = response.displayname;
        }

        this.avatarUrl = utils.mxcToHttp(response.avatar_url, ApiClient.credentials.homeServer);
        this.displayNameRemote = response.displayname;

        return Promise.resolve();
    }

    private get3Pid = async (): Promise<void> => {

        const response = await ApiClient.get3pid()
            .catch(error => { return Promise.reject(error) });

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
    }

    private getEmailPusher = async (): Promise<void> => {

        const response = await ApiClient.getPushers()
            .catch(error => { return Promise.reject(error) });

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
    }

    private saveAvatar = async (): Promise<void> => {

        if (!this.avatarUrl || !this.avatarFile) { return Promise.resolve() }

        const fetchProgress = (_progress: number) => {
            // not used yet
        }

        const fileUri = await FileHandler.uploadFile(ApiClient.credentials, this.avatarFile, fetchProgress)
            .catch(error => { return Promise.reject(error) });

        if (!fileUri) { return Promise.reject('No URI found') }

        await ApiClient.setProfileAvatarUrl(ApiClient.credentials.userIdFull, fileUri)
            .catch(error => { return Promise.reject(error) });

        this.avatarUrl = utils.mxcToHttp(fileUri, ApiClient.credentials.homeServer);

        this.avatarFile = undefined;

        return Promise.resolve();
    }

    private saveDisplayName = async (): Promise<void> => {

        if (!this.displayName || this.displayName === this.displayNameRemote) { return Promise.resolve() }

        await ApiClient.setProfileDisplayName(ApiClient.credentials.userIdFull, this.displayName)
            .catch(error => { return Promise.reject(error) });

        this.displayNameRemote = this.displayName;

        return Promise.resolve();
    }

    private saveNewPassword = async (): Promise<string> => {

        if (!this.newPassword || !this.currentPassword) { return Promise.resolve('') }

        const response1 = await ApiClient.changePassword(this.newPassword)
            .catch(async (error1: AuthResponse_) => {

                if (error1.statusCode === 401 && error1.body.flows[0].stages[0] === 'm.login.password') {

                    const type = error1.body.flows[0].stages[0];
                    const session = error1.body.session;

                    const response2 = await ApiClient.changePassword(this.newPassword, type, session, this.currentPassword)
                        .catch((error2: ErrorResponse_) => { return Promise.resolve(error2) });

                    return Promise.resolve(response2);

                } else {

                    const error3: ErrorResponse_ = {
                        statusCode: 400,
                        body: {
                            error: 'Server Error (unknown response)',
                        },
                    }

                    return Promise.resolve(error3);
                }
            }) as ErrorResponse_;

        if (response1.statusCode && response1.statusCode !== 200) {
            return Promise.reject(response1);
        } else {
            return Promise.resolve('PASSWORD_CHANGED');
        }
    }

    private saveEmailNotifications = async (): Promise<void> => {

        if (!this.emailAddress || (this.emailNotifications === this.emailNotificationsRemote)) { return Promise.resolve() }

        await ApiClient.setEmailPusher(this.emailNotifications, this.emailAddress)
            .catch(error => { return Promise.reject(error) });

        this.emailNotificationsRemote = this.emailNotifications;

        return Promise.resolve();
    }

    private saveSettings = () => {

        RX.UserInterface.dismissKeyboard();

        if (this.newPassword && (this.newPassword !== this.repeatNewPassword)) {

            const text = (
                <RX.Text style={ styles.textDialog }>
                    { newPasswordNoMatch[this.language] }
                </RX.Text>
            );

            RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');

            return;
        }

        this.setState({
            confirmDisabled: true,
            showSpinner: true,
        });

        Promise.all([this.saveDisplayName(), this.saveAvatar(), this.saveNewPassword(), this.saveEmailNotifications()])
            .then(response => {

                this.setState({ showSpinner: false });

                this.setConfirmDisabled();

                if (response[2] === 'PASSWORD_CHANGED') {

                    const text = (
                        <RX.Text style={ styles.textDialog }>
                            { passwordChanged[this.language] }
                        </RX.Text>
                    );

                    RX.Modal.show(<DialogContainer content={ text } modalId={ 'passwordchangedialog' }/>, 'passwordchangedialog');
                }

            }, (error: ErrorResponse_) => {

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { error.body && error.body.error ? error.body.error : '[Unknown error]' }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
            })
            .catch((error: ErrorResponse_) => {

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { error.body && error.body.error ? error.body.error : '[Unknown error]' }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
            });
    }

    private pickAvatar = async () => {

        const file = await FileHandler.pickFile(true).catch(_error => null);

        if (file) {

            this.avatarFile = file;
            this.avatarUrl = file.uri;

            this.setConfirmDisabled();
        }
    }

    private changeDisplayName = (displayName: string) => {

        this.displayName = displayName;

        this.setConfirmDisabled();
    }

    private changePassword = (repeatNewPassword: string) => {

        this.repeatNewPassword = repeatNewPassword;

        this.setConfirmDisabled();
    }

    private setConfirmDisabled = () => {

        const confirmDisabled =
            (!this.avatarFile || !this.avatarUrl) &&
            (!this.displayName || this.displayNameRemote === this.displayName) &&
            (!this.currentPassword || !this.newPassword || !this.repeatNewPassword) &&
            (this.emailNotifications === this.emailNotificationsRemote);

        this.setState({ confirmDisabled: confirmDisabled, });
    }

    private zoomIn = () => {

        this.zoomFactor = this.zoomFactor + 0.05;
        this.webFrame!.setZoomFactor(this.zoomFactor); // eslint-disable-line
        ApiClient.storeZoomFactor(this.zoomFactor);
    }

    private zoomOut = () => {

        this.zoomFactor = this.zoomFactor - 0.05;
        this.webFrame!.setZoomFactor(this.zoomFactor); // eslint-disable-line
        ApiClient.storeZoomFactor(this.zoomFactor);
    }

    private zoomReset = () => {

        this.zoomFactor = 1;
        this.webFrame!.setZoomFactor(1); // eslint-disable-line
        ApiClient.storeZoomFactor(this.zoomFactor);
    }

    private toggleEmailNotifications = () => {

        this.emailNotifications = !this.emailNotifications;
        this.setConfirmDisabled();
    }

    private selectAppColor = (color: string) => {

        this.setState({ appColor: color });
        UiStore.setAppColor(color);
    }

    private onPressUserId = () => {

        if (__DEV__) {

            this.nClicks++;

            if (this.nClicks === 1) {
                setTimeout(() => {
                    this.nClicks = 0;
                }, 5000);
            }

            if (this.nClicks === 5) {

                ApiClient.removeAllPushers();

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        All pushers should have been removed
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'pusherremovaldialog');
            }
        }
    }

    public render(): JSX.Element | null {

        let spinner: ReactElement | undefined;
        if (this.state.showSpinner) {
            spinner = (
                <RX.View style={ styles.spinnerContainer }>
                    <RX.ActivityIndicator color={ LOGO_BACKGROUND } size={ 'large' } />
                </RX.View>
            );
        }

        let avatar: ReactElement;
        if (!this.avatarUrl) {
            avatar = (
                <IconSvg
                    source= { require('../resources/svg/contact.json') as SvgFile }
                    fillColor={ BUTTON_MODAL_TEXT }
                    height={ AVATAR_MEDIUM_WIDTH * 0.5 }
                    width={ AVATAR_MEDIUM_WIDTH * 0.5 }
                />
            )
        } else {
            avatar = (
                <RX.Image
                    resizeMode={ 'cover' }
                    style={ styles.avatar }
                    source={ this.avatarUrl }
                />
            )
        }

        const colorButtonArray: ReactElement[] = [];

        for (let i = 0; i < 6; i++) {
            const colorButton = (
                <RX.Button
                    key={ 'button' + i }
                    style={ [styles.colorButton, { backgroundColor: APP_BACKGROUND[i] }] }
                    onPress={ () => this.selectAppColor(APP_BACKGROUND[i]) }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    <RX.View style={ styles.containerIcon }>
                        <RX.Text style={[styles.checkboxText, { color: 'white' }]}>
                            { this.state.appColor === APP_BACKGROUND[i] ? '✓' : '' }
                        </RX.Text>
                    </RX.View>
                </RX.Button>
            )

            colorButtonArray.push(colorButton);
        }

        let zoomPanel: ReactElement | undefined;
        if (UiStore.getIsElectron()) {

            this.zoomFactor = this.webFrame!.getZoomFactor(); // eslint-disable-line

            zoomPanel = (
                <RX.View style={ styles.buttonsContainer }>
                    <RX.Button
                        style={ styles.zoomButton }
                        onPress={ this.zoomIn }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                    >
                        <RX.View style={ styles.containerIcon }>
                            <RX.Text style={ styles.zoomButtonText }>
                                +
                            </RX.Text>
                        </RX.View>
                    </RX.Button>
                    <RX.Button
                        style={ styles.zoomButton }
                        onPress={ this.zoomOut }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                    >
                        <RX.View style={ styles.containerIcon }>
                            <RX.Text style={ styles.zoomButtonText }>
                                −
                            </RX.Text>
                        </RX.View>
                    </RX.Button>
                    <RX.Button
                        style={ styles.zoomButton }
                        onPress={ this.zoomReset }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                    >
                        <RX.View style={ styles.containerIcon }>
                            <RX.Text style={ styles.zoomButtonText }>
                                ⊡
                            </RX.Text>
                        </RX.View>
                    </RX.Button>
                </RX.View>
            )
        }

        let emailSettings: ReactElement | undefined;
        if (this.emailAddress) {
            emailSettings = (
                <RX.View style={ [styles.settingsContainer, { marginTop: SPACING }] }>

                    <RX.View style={ styles.rowContainer }>

                        <RX.Text style={ styles.label }>
                            { emailAddress[this.language] }
                        </RX.Text>

                        <RX.View style={ styles.textField } title={ this.emailAddress }>

                            <RX.Text numberOfLines={ 1 } style={ styles.userId }>
                                { this.emailAddress || '_' }
                            </RX.Text>

                        </RX.View>

                    </RX.View>

                    <RX.View style={ styles.rowContainer }>

                        <RX.Text style={ styles.label }>
                            { emailNotifications[this.language] }
                        </RX.Text>

                        <RX.View style={ styles.textField }>

                            <RX.Button
                                style={ styles.emailCheckbox }
                                onPress={ this.toggleEmailNotifications }
                                disableTouchOpacityAnimation={ true }
                                activeOpacity={ 1 }
                            >
                                <RX.Text style={[styles.checkboxText, { color: this.emailNotifications ? 'limegreen' : 'red' }]}>
                                    { this.emailNotifications ? '✓' : '✗' }
                                </RX.Text>
                            </RX.Button>

                        </RX.View>

                    </RX.View>

                </RX.View>
            );
        }

        const content = (
            <RX.View style={ styles.contentContainer }>

                { zoomPanel }

                <RX.View style={ styles.buttonsContainer }>
                    { colorButtonArray }
                </RX.View>

                <RX.View style={ styles.settingsContainer }>

                    <RX.View style={ styles.rowContainer }>

                        <RX.Text style={ styles.label }>
                            { userId[this.language] }
                        </RX.Text>

                        <RX.View
                            style={ styles.textField } title={ ApiClient.credentials.userIdFull }
                            onPress={ this.onPressUserId }
                            disableTouchOpacityAnimation={ true }
                            activeOpacity={ 1 }
                        >

                            <RX.Text
                                numberOfLines={ 1 }
                                style={ styles.userId }
                            >
                                { ApiClient.credentials.userIdFull }
                            </RX.Text>

                        </RX.View>

                    </RX.View>

                    <RX.View style={ styles.rowContainer }>

                        <RX.Text style={ styles.label }>
                            { displayName[this.language] }
                        </RX.Text>

                        <RX.View style={ styles.inputField }>

                            <RX.TextInput
                                style={ styles.inputBox }
                                placeholder={ enterYourName[this.language] }
                                placeholderTextColor={ PLACEHOLDER_TEXT }
                                onChangeText={ this.changeDisplayName }
                                value={ this.displayName }
                                disableFullscreenUI={ true }
                                autoCapitalize={ 'none' }
                                keyboardType={ 'default' }
                                autoCorrect={ false }
                                tabIndex={ 1 }
                            />

                        </RX.View>

                    </RX.View>

                    <RX.View style={ styles.rowContainer }>

                        <RX.Text style={ styles.label }>
                            { profilePicture[this.language] }
                        </RX.Text>

                        <RX.View style={ styles.inputField }>

                            <RX.View
                                style={ styles.avatarContainer }
                                onPress={ this.pickAvatar }
                                disableTouchOpacityAnimation={ true }
                                activeOpacity={ 1 }
                            >

                                { avatar }

                            </RX.View>

                        </RX.View>

                    </RX.View>

                    <RX.View style={ styles.rowContainer }>

                        <RX.Text style={ styles.label }>
                            { userPassword[this.language] }
                        </RX.Text>

                        <RX.View style={ styles.inputField }>

                            <RX.TextInput
                                style={ [styles.inputBox, { marginBottom: 3 }] }
                                placeholder={ currentPassword[this.language] }
                                placeholderTextColor={ PLACEHOLDER_TEXT }
                                onChangeText={ password => this.currentPassword = password }
                                secureTextEntry={ true }
                                disableFullscreenUI={ true }
                                autoCapitalize={ 'none' }
                                keyboardType={ 'default' }
                                tabIndex={ 2 }
                            />

                            <RX.TextInput
                                style={ [styles.inputBox, { marginBottom: 3 }] }
                                placeholder={ newPassword[this.language] }
                                placeholderTextColor={ PLACEHOLDER_TEXT }
                                onChangeText={ password => this.newPassword = password }
                                secureTextEntry={ true }
                                disableFullscreenUI={ true }
                                autoCapitalize={ 'none' }
                                keyboardType={ 'default' }
                                tabIndex={ 3 }
                            />

                            <RX.TextInput
                                style={ styles.inputBox }
                                placeholder={ repeatNewPassword[this.language] }
                                placeholderTextColor={ PLACEHOLDER_TEXT }
                                onChangeText={ this.changePassword }
                                secureTextEntry={ true }
                                disableFullscreenUI={ true }
                                autoCapitalize={ 'none' }
                                keyboardType={ 'default' }
                                tabIndex={ 4 }
                            />

                        </RX.View>

                    </RX.View>

                </RX.View>

                { emailSettings }

                { spinner }

            </RX.View>
        );

        const settingsDialog = (
            <DialogContainer
                content={ content }
                confirmButton={ true }
                confirmButtonText={ save[this.language] }
                cancelButton={ true }
                cancelButtonText={ close[this.language] }
                onConfirm={ this.saveSettings }
                onCancel={ () => RX.Modal.dismissAll() }
                confirmDisabled={ this.state.confirmDisabled || this.state.offline }
                backgroundColorContent={ TRANSPARENT_BACKGROUND }
                scrollEnabled={ ['android', 'ios'].includes(UiStore.getPlatform()) }
            />
        );

        return (
            <RX.View style={ styles.modalScreen }>
                { settingsDialog }
            </RX.View>
        );
    }
}
