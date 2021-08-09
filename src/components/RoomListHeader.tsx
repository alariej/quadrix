import React, { ReactElement } from 'react';
import RX from 'reactxp';
import DataStore from '../stores/DataStore';
import { ComponentBase } from 'resub';
import { BUTTON_ROUND_BACKGROUND, HEADER_TEXT, MODAL_CONTENT_TEXT, LINK_TEXT, HEADER_HEIGHT, FONT_NORMAL,
    BUTTON_ROUND_WIDTH, FONT_LARGE, BORDER_RADIUS, SPACING, ICON_REDUCTION_FACTOR, LOGO_BACKGROUND, TRANSPARENT_BACKGROUND } from '../ui';
import ApiClient from '../matrix/ApiClient';
import DialogNewRoom from '../dialogs/DialogNewRoom';
import DialogContainer from '../modules/DialogContainer';
import DialogSettings from '../dialogs/DialogSettings';
import UiStore from '../stores/UiStore';
import { pressOKToLogout, cancel, termsPrivacyLicense, Languages } from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import { APP_VERSION, APP_WEBSITE, TERMS_URL, GIT_REPO_URL } from '../appconfig';
import Pushers from '../modules/Pushers';

const styles = {
    container: RX.Styles.createViewStyle({
        flexDirection: 'row',
        height: HEADER_HEIGHT,
        marginBottom: SPACING,
    }),
    containerHeader: RX.Styles.createViewStyle({
        flex: 1,
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS,
        cursor: 'pointer',
        backgroundColor: TRANSPARENT_BACKGROUND
    }),
    userName: RX.Styles.createViewStyle({
        flexDirection: 'row',
        justifyContent: 'center',
    }),
    text: RX.Styles.createTextStyle({
        fontSize: FONT_NORMAL,
        color: HEADER_TEXT,
    }),
    roundButton: RX.Styles.createViewStyle({
        borderRadius: BUTTON_ROUND_WIDTH / 2,
        borderWidth: 1,
        borderColor: LOGO_BACKGROUND,
        width: BUTTON_ROUND_WIDTH,
        height: BUTTON_ROUND_WIDTH,
        backgroundColor: BUTTON_ROUND_BACKGROUND,
        marginLeft: SPACING,
    }),
    containerIcon: RX.Styles.createViewStyle({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    connectedContainer: RX.Styles.createViewStyle({
        position: 'absolute',
        height: 14,
        width: 14,
        bottom: SPACING,
        right: SPACING,
    }),
    logoutTextDialog: RX.Styles.createTextStyle({
        fontSize: FONT_LARGE,
        textAlign: 'center',
        color: MODAL_CONTENT_TEXT,
        marginVertical: 12,
        marginHorizontal: 24,
    }),
    containerAbout: RX.Styles.createViewStyle({
        padding: SPACING,
        alignItems: 'center',
    }),
    link: RX.Styles.createTextStyle({
        fontSize: FONT_NORMAL,
        color: LINK_TEXT,
        textDecorationLine: 'underline',
        textAlign: 'center',
        padding: 12,
        backgroundColor: TRANSPARENT_BACKGROUND,
    }),
    app_name: RX.Styles.createViewStyle({
        marginVertical: 12,
    }),
    textVersion: RX.Styles.createTextStyle({
        fontSize: FONT_NORMAL,
        textAlign: 'center',
        color: MODAL_CONTENT_TEXT,
        marginVertical: 12,
    }),
};

interface RoomListHeaderProps extends RX.CommonProps {
    showLogin: () => void;
    showRoom: (roomId: string) => void;
}

interface RoomListHeaderState {
    offline: boolean;
}

export default class RoomListHeader extends ComponentBase<RoomListHeaderProps, RoomListHeaderState> {

    private language: Languages = 'en';

    constructor(props: RoomListHeaderProps) {
        super(props);

        this.language = UiStore.getLanguage();
    }

    protected _buildState(): RoomListHeaderState {

        if (UiStore.getUnknownAccessToken()) {
            this.doLogout().catch(_error => null);
        }

        return {
            offline: UiStore.getOffline(),
        };
    }

    private doLogout = async () => {

        RX.Modal.dismissAll();

        Pushers.removeFromDevice(ApiClient.credentials).catch(_error => null);

        ApiClient.stopSync();
        ApiClient.clearNextSyncToken();
        await ApiClient.clearStorage();
        await ApiClient.storeLastUserId();
        DataStore.clearRoomSummaryList();

        this.props.showLogin();
    }

    private onLogout = () => {

        const text = (
            <RX.Text style={ styles.logoutTextDialog }>
                { pressOKToLogout[this.language] }
            </RX.Text>
        );

        const logoutConfirmation = (
            <DialogContainer
                content={ text }
                confirmButton={ true }
                confirmButtonText={ 'OK' }
                cancelButton={ true }
                cancelButtonText={ cancel[this.language] }
                onConfirm={ this.doLogout }
                onCancel={ () => RX.Modal.dismissAll() }
            />
        );

        RX.Modal.show(logoutConfirmation, 'logoutConfirmation');
    }

    private onPressSettings = () => {

        RX.Modal.show(<DialogSettings/>, 'dialogsettings');
    }

    private openUrl = (url: string, event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        if (UiStore.getIsElectron()) {

            const { shell } = window.require('electron');
            shell.openExternal(url).catch(_error => null);

        } else {

            RX.Linking.openUrl(url).catch(_error => null);
        }
    }

    private onPressTile = () => {

        const text = (
            <RX.View style={ styles.containerAbout }>
                <IconSvg
                    style={ styles.app_name }
                    source= { require('../resources/svg/appname.json') as SvgFile }
                    height={ 24 }
                    width={ 24 * 347.48401 / 89.798973 }
                    fillColor={ LOGO_BACKGROUND }
                />
                <RX.Text style={ styles.textVersion }>
                    { 'Version: ' + APP_VERSION }
                </RX.Text>
                <RX.Text
                    style={ styles.link }
                    onPress={ event => this.openUrl(GIT_REPO_URL, event) }
                >
                    { APP_WEBSITE }
                </RX.Text>
                <RX.Text
                    style={ styles.link }
                    onPress={ event => this.openUrl(TERMS_URL, event) }
                >
                    { termsPrivacyLicense[this.language] }
                </RX.Text>
            </RX.View>
        );

        const versionDialog = (
            <DialogContainer
                content={ text }
                confirmButton={ false }
                cancelButton={ false }
                onCancel={ () => RX.Modal.dismissAll() }
            />
        );

        RX.Modal.show(versionDialog, 'versionDialog');
    }

    private onPressNewChat = () => {

        RX.Modal.show(<DialogNewRoom showRoom={ this.props.showRoom }/>, 'dialognewroom');
    }

    public render(): JSX.Element | null {

        let disconnected: ReactElement;
        if (this.state.offline) {
            disconnected = (
                <RX.View style={ styles.connectedContainer }>
                    <IconSvg
                        source= { require('../resources/svg/nosignal.json') as SvgFile }
                        fillColor={ HEADER_TEXT }
                        height={ 14 }
                        width={ 14 }
                    />
                </RX.View>
            )
        }

        return (
            <RX.View style={ styles.container }>
                <RX.View
                    style={ styles.containerHeader}
                    onPress={ this.onPressTile }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >

                    { disconnected! }

                    <RX.View style={ styles.userName }>
                        <RX.Text style={ styles.text }>
                            { ApiClient.credentials.userIdFull }
                        </RX.Text>
                    </RX.View>
                </RX.View>
                <RX.Button
                    style={ styles.roundButton }
                    onPress={ this.onPressNewChat }
                    disableTouchOpacityAnimation={ false }
                    underlayColor={ LOGO_BACKGROUND }
                    activeOpacity={ 0.8 }
                    disabled={ this.state.offline }
                    disabledOpacity={ 0.15 }
                >
                    <RX.View style={ styles.containerIcon }>
                        <IconSvg
                            source= { require('../resources/svg/plus.json') as SvgFile }
                            fillColor={ LOGO_BACKGROUND }
                            height={ BUTTON_ROUND_WIDTH / ICON_REDUCTION_FACTOR }
                            width={ BUTTON_ROUND_WIDTH / ICON_REDUCTION_FACTOR }
                        />
                    </RX.View>
                </RX.Button>
                <RX.Button
                    style={ styles.roundButton }
                    onPress={ this.onPressSettings }
                    disableTouchOpacityAnimation={ false }
                    underlayColor={ LOGO_BACKGROUND }
                    activeOpacity={ 0.8 }
                    disabled={ this.state.offline }
                    disabledOpacity={ 0.15 }
                >
                    <RX.View style={ styles.containerIcon }>
                        <IconSvg
                            source= { require('../resources/svg/settings.json') as SvgFile }
                            fillColor={ LOGO_BACKGROUND }
                            height={ BUTTON_ROUND_WIDTH / ICON_REDUCTION_FACTOR }
                            width={ BUTTON_ROUND_WIDTH / ICON_REDUCTION_FACTOR }
                        />
                    </RX.View>
                </RX.Button>
                <RX.Button
                    style={ styles.roundButton }
                    onPress={ this.onLogout }
                    disableTouchOpacityAnimation={ false }
                    underlayColor={ LOGO_BACKGROUND }
                    activeOpacity={ 0.8 }
                >
                    <RX.View style={ styles.containerIcon }>
                        <IconSvg
                            source= { require('../resources/svg/logout.json') as SvgFile }
                            style={ { marginBottom: 2 } }
                            fillColor={ LOGO_BACKGROUND }
                            height={ BUTTON_ROUND_WIDTH / ICON_REDUCTION_FACTOR }
                            width={ BUTTON_ROUND_WIDTH / ICON_REDUCTION_FACTOR }
                        />
                    </RX.View>
                </RX.Button>
            </RX.View>
        );
    }
}
