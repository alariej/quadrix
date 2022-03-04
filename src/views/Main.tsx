import React, { ReactElement } from 'react';
import RX, { Types } from 'reactxp';
import RoomList from './RoomList';
import Room from './Room';
import { PAGE_MARGIN, MODAL_CONTENT_TEXT, FONT_LARGE, COMPOSER_BORDER,
    PAGE_WIDE_PADDING, OBJECT_MARGIN, TRANSPARENT_BACKGROUND, HEADER_HEIGHT, TILE_WIDTH, LARGE_LOGO_FOREGROUND } from '../ui';
import DataStore from '../stores/DataStore';
import { MessageEvent } from '../models/MessageEvent';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import ShareHandlerIncoming from '../modules/ShareHandlerIncoming';
import UiStore, { Layout } from '../stores/UiStore';
import { deviceOffline } from '../translations';
import JitsiMeet from '../modules/JitsiMeet';
import { ComponentBase } from 'resub';
import Pushers from '../modules/Pushers';
import SpinnerUtils from '../utils/SpinnerUtils';
import AppFont from '../modules/AppFont';
import IconSvg, { SvgFile } from '../components/IconSvg';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
        flexDirection: 'row',
        padding: PAGE_MARGIN,
    }),
    containerAnimated: RX.Styles.createViewStyle({
        flex: 1,
        flexDirection: 'row',
    }),
    containerRoomList: RX.Styles.createViewStyle({
        marginRight: PAGE_MARGIN,
    }),
    containerRoom: RX.Styles.createViewStyle({
        marginLeft: PAGE_MARGIN,
    }),
    textDialog: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        textAlign: 'center',
        color: MODAL_CONTENT_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
    paddingLeft: RX.Styles.createViewStyle({
        width: PAGE_WIDE_PADDING,
    }),
    paddingRight: RX.Styles.createViewStyle({
        width: PAGE_WIDE_PADDING,
        borderWidth: 0,
        borderLeftWidth: 1,
        borderColor: COMPOSER_BORDER,
    }),
    background: RX.Styles.createViewStyle({
        position: 'absolute',
        top: HEADER_HEIGHT,
        bottom: 0,
        right: 0,
        padding: OBJECT_MARGIN * 2,
        alignItems: 'center',
        justifyContent: 'center',
    }),
};

interface MainProps {
    showLogin: () => void;
    sharedContent: string;
}

interface MainState {
    showRoom: boolean;
    showJitsiMeet: boolean;
    layout: Layout;
}

export default class Main extends ComponentBase<MainProps, MainState> {

    private message!: MessageEvent;
    private tempId = '';
    private jitsiMeetId = '';
    private animatedValue!: RX.Animated.Value;
    private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
    private roomList: ReactElement | undefined;
    private room: ReactElement | undefined;
    private appLayoutSubscription: number;
    private appOfflineSubscription: number;
    private isOffline: boolean;

    constructor(props: MainProps) {
        super(props);

        this.appLayoutSubscription = UiStore.subscribe(this.changeAppLayout, UiStore.LayoutTrigger);
        this.appOfflineSubscription = UiStore.subscribe(this.changeAppOffline, UiStore.OfflineTrigger);

        this.isOffline = UiStore.getOffline();

        this.roomList = (
            <RoomList
                showRoom={ this.showRoom }
                showLogin={ this.props.showLogin }
            />
        );
    }

    private changeAppLayout = () => {

        if (RX.App.getActivationState() === Types.AppActivationState.Active) {
            this.setState({ layout: UiStore.getAppLayout() });
        }
    }

    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        UiStore.setUnknownAccessToken(false);

        Pushers.set(ApiClient.credentials).catch(_error => null);

        if (!this.isOffline) {

            DataStore.setSyncComplete(false);

            const storedSyncToken = await ApiClient.getStoredSyncToken()!;

            if (storedSyncToken) {

                ApiClient.setNextSyncToken(storedSyncToken);

                await ApiClient.restoreDataStore()
                    .then(_response => {

                        ApiClient.startSync(storedSyncToken);
                        this.showRoomList();
                        ShareHandlerIncoming.launchedFromSharedContent(this.props.sharedContent, this.shareContent);
                    })
                    .catch(_error => {

                        ApiClient.clearNextSyncToken();
                        ApiClient.startSync('');
                        this.showRoomList();
                    });

            } else {
                ApiClient.clearNextSyncToken();
                ApiClient.startSync('');
                this.showRoomList();
            }

        } else {

            await ApiClient.getStoredSyncToken()
                .then(token => {
                    ApiClient.setNextSyncToken(token!);
                })
                .catch(_error => null);

            await ApiClient.restoreDataStore()
                .then(_response => {

                    ApiClient.stopSync();
                    DataStore.setSyncComplete(true);
                    this.showRoomList();
                })
                .catch(_error => {

                    const text = (
                        <RX.Text style={ styles.textDialog }>
                            { deviceOffline[UiStore.getLanguage()] }
                        </RX.Text>
                    );

                    const dialog = (
                        <DialogContainer
                            content={ text }
                            confirmButton={ true }
                            confirmButtonText={ 'OK' }
                            onConfirm={ () => { RX.Modal.dismissAll(); this.showRoomList() } }
                        />
                    );

                    RX.Modal.show(dialog, 'modaldialog_nodata');
                });
        }

        RX.App.activationStateChangedEvent.subscribe(this.activationChanged);

        RX.Input.backButtonEvent.subscribe(this.onBackButton);

        ShareHandlerIncoming.addListener(this.shareContent);

        if (!this.state.layout) {
            this.setState({ layout: UiStore.getAppLayout() });
        }
    }

    public componentWillUnmount(): void {
        super.componentWillUnmount();

        RX.Input.backButtonEvent.unsubscribe(this.onBackButton);

        RX.App.activationStateChangedEvent.unsubscribe(this.activationChanged);

        ShareHandlerIncoming.removeListener(this.shareContent);

        UiStore.unsubscribe(this.appLayoutSubscription);
        UiStore.unsubscribe(this.appOfflineSubscription);
    }

    private activationChanged = (activationState: Types.AppActivationState) => {

        if (activationState !== Types.AppActivationState.Active) {

            ApiClient.stopSync();
            ApiClient.storeAppData().catch(_error => null);

        } else {

            if (ApiClient.isSyncStopped() && !this.isOffline) {

                DataStore.setSyncComplete(false);

                if (!RX.Modal.isDisplayed()) {
                    SpinnerUtils.showModalSpinner('syncspinner', TRANSPARENT_BACKGROUND);
                }

                const nextSyncToken = ApiClient.getNextSyncToken();
                ApiClient.startSync(nextSyncToken);
            }
        }
    }

    private changeAppOffline = () => {

        this.isOffline = UiStore.getOffline();

        if (this.isOffline) {

            ApiClient.stopSync();
            ApiClient.storeAppData().catch(_error => null);

        } else {

            if (ApiClient.isSyncStopped()) {

                DataStore.setSyncComplete(false);

                if (!RX.Modal.isDisplayed()) {
                    SpinnerUtils.showModalSpinner('syncspinner', TRANSPARENT_BACKGROUND);
                }

                const nextSyncToken = ApiClient.getNextSyncToken();
                ApiClient.startSync(nextSyncToken);
            }
        }
    }

    private shareContent = (event: { url: string }) => {

        this.showRoomList();
        ShareHandlerIncoming.shareContent(event.url, this.showTempForwardedMessage);
    }

    private onBackButton = () => {

        RX.Modal.dismissAll();
        this.showRoomList();
        return true;
    }

    private showTempForwardedMessage = (roomId: string, message: MessageEvent, tempId: string) => {

        SpinnerUtils.dismissModalSpinner('forwardmessagespinner');

        this.message = message;
        this.tempId = tempId;

        this.room = (
            <Room
                roomId={ roomId }
                showLogin={ this.props.showLogin }
                showRoomList={ this.showRoomList }
                showTempForwardedMessage={ this.showTempForwardedMessage }
                tempForwardedMessage={ { message: this.message, tempId: this.tempId } }
                showJitsiMeet={ this.showJitsiMeet }
            />
        );

        if (this.state.layout.type !== 'wide') {

            this.animatedValue = RX.Animated.createValue(0);
            this.animatedStyle = RX.Styles.createAnimatedViewStyle({
                transform: [{ translateX: this.animatedValue }]
            });

            RX.Animated.timing(this.animatedValue, {
                duration: 250,
                toValue: -this.state.layout.pageWidth,
                easing: RX.Animated.Easing.InOut(),
                useNativeDriver: true,
            }).start();
        }

        UiStore.setSelectedRoom(roomId);
        this.setState({ showRoom: true });
    }

    private showRoom = (roomId: string) => {

        this.room = (
            <Room
                roomId={ roomId }
                showLogin={ this.props.showLogin }
                showRoomList={ this.showRoomList }
                showTempForwardedMessage={ this.showTempForwardedMessage }
                showJitsiMeet={ this.showJitsiMeet }
            />
        );

        if (this.state.layout.type !== 'wide') {

            this.animatedValue = RX.Animated.createValue(0);
            this.animatedStyle = RX.Styles.createAnimatedViewStyle({
                transform: [{ translateX: this.animatedValue }]
            });

            RX.Animated.timing(this.animatedValue, {
                duration: 250,
                toValue: -this.state.layout.pageWidth,
                easing: RX.Animated.Easing.InOut(),
                useNativeDriver: true,
            }).start();
        }

        UiStore.setSelectedRoom(roomId);
        this.setState({ showRoom: true });
    }

    private showRoomList = () => {

        if (this.state.layout?.type !== 'wide' && this.room) {

            this.animatedValue = RX.Animated.createValue(-this.state.layout.pageWidth);
            this.animatedStyle = RX.Styles.createAnimatedViewStyle({
                transform: [{ translateX: this.animatedValue }]
            });

            RX.Animated.timing(this.animatedValue, {
                duration: 250,
                toValue: 0,
                easing: RX.Animated.Easing.InOut(),
                useNativeDriver: true,
            }).start(() => {
                this.room = undefined;
                this.setState({ showRoom: false });
            });

            this.forceUpdate();

        } else {
            this.room = undefined;
            this.setState({ showRoom: false });
        }

        UiStore.setSelectedRoom('');
    }

    private showJitsiMeet = (jitsiMeetId: string) => {

        this.jitsiMeetId = jitsiMeetId;
        UiStore.setJitsiActive(true);
        this.setState({ showJitsiMeet: true });
    }

    private closeJitsiMeet = () => {

        UiStore.setJitsiActive(false);
        this.setState({ showJitsiMeet: false });
    }

    public render(): JSX.Element | null {

        if (!this.state.layout) { return null; }

        const roomListPage = (
            <RX.View style={ [styles.containerRoomList, { width: this.state.layout.pageWidth - PAGE_MARGIN * 2 }] }>
                { this.roomList }
            </RX.View>
        );

        let room: ReactElement | undefined;
        if (this.state.showRoom && this.room) {
            room = this.room;
        }

        const roomPage = (
            <RX.View style={ [styles.containerRoom, { width: this.state.layout.pageWidth - PAGE_MARGIN * 2 }] }>
                { room }
            </RX.View>
        );

        let jitsiMeet: ReactElement | undefined;
        if (this.state.showJitsiMeet) {
            jitsiMeet = (
                <JitsiMeet
                    jitsiMeetId={ this.jitsiMeetId }
                    closeJitsiMeet={ this.closeJitsiMeet }
                />
            );
        }

        let paddingLeft;
        let paddingRight;
        let backgroundPadding = 0;
        if (this.state.layout.type === 'wide') {
            paddingLeft = <RX.View style={ styles.paddingLeft }/>;
            paddingRight = <RX.View style={ styles.paddingRight }/>;
            backgroundPadding = PAGE_WIDE_PADDING * 2;
        }

        const backgroundImage = (
            <RX.View style={ [styles.background, { left: this.state.layout.pageWidth + backgroundPadding }] }>
                <IconSvg
                    source= { require('../resources/svg/logo.json') as SvgFile }
                    height={ TILE_WIDTH }
                    width={ TILE_WIDTH }
                    fillColor={ LARGE_LOGO_FOREGROUND }
                />
            </RX.View>
        );

        return (
            <RX.View style={{ flex: 1 }}>
                <RX.View
                    style={ [
                        styles.container,
                        {
                            width: this.state.layout.containerWidth,
                            alignSelf: this.state.layout.type === 'wide' ? 'center' : undefined,
                        }
                    ] }
                >
                    <RX.Animated.View
                        style={ [styles.containerAnimated, this.animatedStyle] }
                    >
                        { backgroundImage }
                        { roomListPage }
                        { paddingLeft}
                        { paddingRight }
                        { roomPage }
                    </RX.Animated.View>
                </RX.View>
                { jitsiMeet }
            </RX.View>
        );
    }
}
