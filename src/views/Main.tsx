import React, { ReactElement } from 'react';
import RX, { Types } from 'reactxp';
import RoomList from './RoomList';
import Room from './Room';
import { PAGE_MARGIN, MODAL_CONTENT_TEXT, FONT_LARGE, COMPOSER_BORDER, LOGO_BACKGROUND,
    PAGE_WIDE_PADDING, BUTTON_LONG_TEXT, OBJECT_MARGIN, TRANSPARENT_BACKGROUND } from '../ui';
import DataStore from '../stores/DataStore';
import { MessageEvent } from '../models/MessageEvent';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import ShareHandlerIncoming from '../modules/ShareHandlerIncoming';
import UiStore, { Layout } from '../stores/UiStore';
import RXNetInfo from 'reactxp-netinfo';
import { deviceOffline } from '../translations';
import JitsiMeet from '../modules/JitsiMeet';
import IconSvg, { SvgFile } from '../components/IconSvg';
import { ComponentBase } from 'resub';
import ModalSpinner from '../components/ModalSpinner';

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
    textPlaceholder: RX.Styles.createTextStyle({
        flexDirection: 'row',
        fontSize: FONT_LARGE,
        textAlign: 'center',
        color: BUTTON_LONG_TEXT,
        marginBottom: OBJECT_MARGIN,
    }),
    viewPlaceholder: RX.Styles.createViewStyle({
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }),
};

type DisplayPage = 'roomList' | 'room' | 'tempMessage';

interface MainProps {
    showLogin: () => void;
    sharedContent: string;
}

interface MainState {
    displayPage: DisplayPage;
    showJitsiMeet: boolean;
    layout: Layout;
}

export default class Main extends ComponentBase<MainProps, MainState> {

    private message!: MessageEvent;
    private tempId = '';
    private jitsiMeetId = '';
    private animatedValue!: RX.Animated.Value;
    private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
    private room: ReactElement | undefined;
    private appLayoutSubscription: number;

    constructor(props: MainProps) {
        super(props);

        this.appLayoutSubscription = UiStore.subscribe(this.changeAppLayout, UiStore.LayoutTrigger);
    }

    private changeAppLayout = () => {
        this.setState({ layout: UiStore.getAppLayout() });
    }

    public componentDidMount(): void {
        super.componentDidMount();

        UiStore.setUnknownAccessToken(false);

        ApiClient.setPusher();

        RXNetInfo.isConnected()
            .then(async isConnected => {

                ApiClient.setIsConnected(isConnected);

                if (isConnected) {

                    DataStore.setSyncComplete(false);

                    const storedSyncToken = await ApiClient.getStoredSyncToken()!;

                    if (storedSyncToken) {

                        ApiClient.setNextSyncToken(storedSyncToken);

                        ApiClient.restoreDataStore()
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

                    UiStore.setOffline(true);

                    ApiClient.getStoredSyncToken()
                        .then(token => {
                            ApiClient.setNextSyncToken(token!);
                        })
                        .catch(_error => null);

                    ApiClient.restoreDataStore()
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
            })
            .catch(_error => null);

        RX.App.activationStateChangedEvent.subscribe(this.activationChanged);

        RXNetInfo.connectivityChangedEvent.subscribe(this.connectivityChanged);

        RX.Input.backButtonEvent.subscribe(this.onBackButton);

        ShareHandlerIncoming.addListener(this.shareContent);

        if (!this.state.layout) {
            this.setState({ layout: UiStore.getAppLayout() });
        }
    }

    public componentWillUnmount(): void {
        super.componentWillUnmount();

        RX.Input.backButtonEvent.unsubscribe(this.onBackButton);

        RXNetInfo.connectivityChangedEvent.unsubscribe(this.connectivityChanged);

        RX.App.activationStateChangedEvent.unsubscribe(this.activationChanged);

        ShareHandlerIncoming.removeListener(this.shareContent);

        UiStore.unsubscribe(this.appLayoutSubscription);
    }

    private activationChanged = (activationState: Types.AppActivationState) => {

        if (activationState !== Types.AppActivationState.Active) {

            ApiClient.stopSync();
            ApiClient.storeAppData().catch(_error => null);

        } else {

            if (ApiClient.isSyncStopped()) {

                DataStore.setSyncComplete(false);

                if (!RX.Modal.isDisplayed('DialogRoomPicker')) {
                    RX.Modal.show(<ModalSpinner backgroundColor={ TRANSPARENT_BACKGROUND }/>, 'syncspinner');
                }

                const nextSyncToken = ApiClient.getNextSyncToken();
                ApiClient.startSync(nextSyncToken);
            }
        }
    }

    private connectivityChanged = (isConnected: boolean) => {

        ApiClient.setIsConnected(isConnected);

        if (!isConnected) {

            UiStore.setOffline(true);
            ApiClient.stopSync();
            ApiClient.storeAppData().catch(_error => null);

        } else {

            UiStore.setOffline(false);

            if (ApiClient.isSyncStopped()) {

                DataStore.setSyncComplete(false);
                RX.Modal.show(<ModalSpinner backgroundColor={ TRANSPARENT_BACKGROUND }/>, 'syncspinner');

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

        RX.Modal.dismiss('modalspinner_forwardmessage');

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

        this.setState({ displayPage: 'tempMessage' });
        UiStore.setSelectedRoom(roomId);
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

        this.setState({ displayPage: 'room' });
        UiStore.setSelectedRoom(roomId);
    }

    private showRoomList = () => {

        if (this.state.layout.type !== 'wide') {

            this.animatedValue = RX.Animated.createValue(-this.state.layout.pageWidth);
            this.animatedStyle = RX.Styles.createAnimatedViewStyle({
                transform: [{ translateX: this.animatedValue }]
            });

            RX.Animated.timing(this.animatedValue, {
                duration: 250,
                toValue: 0,
                easing: RX.Animated.Easing.InOut(),
                useNativeDriver: true,
            }).start();
        }

        this.setState({ displayPage: 'roomList' });
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
            <RX.View style={[styles.containerRoomList, { width: this.state.layout.pageWidth - PAGE_MARGIN * 2 }]}>
                <RoomList
                    showRoom={ this.showRoom }
                    showLogin={ this.props.showLogin }
                />
            </RX.View>
        );

        let room: ReactElement | undefined;
        if (['room', 'tempMessage'].includes(this.state.displayPage)) {
            room = this.room;
        } else {
            if (this.state.layout.type === 'wide') {
                room = (
                    <RX.View style={ styles.viewPlaceholder }>
                        <RX.Text style={ styles.textPlaceholder }>
                            <RX.Text>
                                CHAT. ON.
                            </RX.Text>
                            <RX.Text style={{ fontSize: 20, fontWeight: 'normal', marginLeft: 4 }}>
                                [
                            </RX.Text>
                            <RX.Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                                matrix
                            </RX.Text>
                            <RX.Text style={{ fontSize: 20, fontWeight: 'normal' }}>
                                ]
                            </RX.Text>
                        </RX.Text>
                        <IconSvg
                            source= { require('../resources/svg/appname.json') as SvgFile }
                            height={ 36 }
                            width={ 36 * 347.48401 / 89.798973 }
                            fillColor={ LOGO_BACKGROUND }
                        />
                    </RX.View>
                );
            }
        }

        const roomPage = (
            <RX.View style={[styles.containerRoom, { width: this.state.layout.pageWidth - PAGE_MARGIN * 2 }]}>
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
        if (this.state.layout.type === 'wide') {
            paddingLeft = <RX.View style={ styles.paddingLeft }/>;
            paddingRight = <RX.View style={ styles.paddingRight }/>;
        }

        return (
            <RX.View style={{ flex: 1 }}>
                <RX.View
                    style={[
                        styles.container,
                        {
                            width: this.state.layout.containerWidth,
                            alignSelf: this.state.layout.type === 'wide' ? 'center' : undefined,
                        }
                    ]}
                >
                    <RX.Animated.View
                        style={[styles.containerAnimated, this.animatedStyle]}
                    >
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
