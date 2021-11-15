import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { BUTTON_ROUND_BACKGROUND, BUTTON_UNREAD_BACKGROUND, OPAQUE_DUMMY_BACKGROUND, TILE_BACKGROUND,
    MODAL_CONTENT_TEXT, BUTTON_LONG_TEXT, BORDER_RADIUS, BUTTON_LONG_WIDTH, BUTTON_HEIGHT, BUTTON_ROUND_WIDTH, FONT_NORMAL, SPACING,
    FONT_LARGE, LOGO_BACKGROUND, MESSAGE_HEIGHT_DEFAULT, DARK_BACKGROUND, OBJECT_MARGIN } from '../ui';
import { MESSAGE_COUNT_ADD } from  '../appconfig';
import { ComponentBase } from 'resub';
import DataStore from '../stores/DataStore';
import { VirtualListView, VirtualListViewItemInfo, VirtualListViewCellRenderDetails } from 'reactxp-virtuallistview';
import MessageTile from './MessageTile';
import ApiClient from '../matrix/ApiClient';
import EventUtils from '../utils/EventUtils';
import { MessageEvent, TemporaryMessage } from '../models/MessageEvent';
import { MessageEventContent_, RoomType } from '../models/MatrixApi';
import SystemMessage from './SystemMessage';
import DialogContainer from '../modules/DialogContainer';
import UiStore from '../stores/UiStore';
import { yesterdayWord, fetchingMessages, noMoreMessages, Languages, errorLoadingMessages } from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import { differenceInDays, format, isSameYear, isToday, isYesterday, Locale } from 'date-fns';
import Spinner from './Spinner';
import AppFont from '../modules/AppFont';
import background100 from '../resources/png/background100.png';
import background200 from '../resources/png/background200.png';
import background400 from '../resources/png/background400.png';
import background600 from '../resources/png/background600.png';
import background800 from '../resources/png/background800.png';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
        borderRadius: BORDER_RADIUS,
    }),
    containerArrowButton: RX.Styles.createViewStyle({
        position: 'absolute',
        top: 12,
        right: 12,
        width: BUTTON_ROUND_WIDTH,
        height: BUTTON_ROUND_WIDTH,
    }),
    containerMoreButton: RX.Styles.createViewStyle({
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: BUTTON_ROUND_WIDTH,
        height: BUTTON_ROUND_WIDTH,
    }),
    roundButton: RX.Styles.createViewStyle({
        width: BUTTON_ROUND_WIDTH,
        height: BUTTON_ROUND_WIDTH,
        borderRadius: BUTTON_ROUND_WIDTH / 2,
        backgroundColor: BUTTON_ROUND_BACKGROUND,
        borderWidth: 1,
        borderColor: LOGO_BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    containerIcon: RX.Styles.createViewStyle({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    moreButtonText: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: 24,
        fontWeight: 'bold',
        color: LOGO_BACKGROUND,
    }),
    containerLoadingButton: RX.Styles.createViewStyle({
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
    }),
    loadingButton: RX.Styles.createViewStyle({
        flexDirection: 'row',
        width: BUTTON_LONG_WIDTH,
        height: BUTTON_HEIGHT,
        borderRadius: BUTTON_HEIGHT / 2,
        backgroundColor: DARK_BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    loadingButtonText: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_NORMAL,
        color: BUTTON_LONG_TEXT,
    }),
    spinner: RX.Styles.createViewStyle({
        position: 'absolute',
        right: OBJECT_MARGIN,
    }),
    containerWrapper: RX.Styles.createViewStyle({
        backgroundColor: OPAQUE_DUMMY_BACKGROUND,
    }),
    containerDate: RX.Styles.createViewStyle({
        flexDirection: 'row',
        justifyContent: 'center',
        marginRight: 16,
        marginBottom: SPACING,
    }),
    date: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_NORMAL,
        padding: 3,
        borderRadius: 4,
        backgroundColor: TILE_BACKGROUND,
    }),
    textDialog: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        textAlign: 'center',
        color: MODAL_CONTENT_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
    background: RX.Styles.createViewStyle({
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        opacity: 0.1,
    }),
    image: RX.Styles.createImageStyle({
        flex: 1,
    }),
};

interface EventListItemInfo extends VirtualListViewItemInfo {
    event: MessageEvent;
    readMarkerType: string;
    isRedacted?: boolean;
}

interface RoomChatState {
    eventListItems: EventListItemInfo[];
    showArrowButton: boolean;
    showMoreButton: boolean;
    showLoadingButton: boolean;
    showNewMessageButton: boolean;
    offline: boolean;
}

interface RoomChatProps extends RX.CommonProps {
    roomId: string;
    roomType: RoomType;
    tempSentMessage: TemporaryMessage;
    setReplyMessage: (message: TemporaryMessage) => void;
    showTempForwardedMessage: (roomId: string, message: MessageEvent, tempId: string) => void;
    tempForwardedMessage: { message: MessageEvent, tempId: string }
}

export default class RoomChat extends ComponentBase<RoomChatProps, RoomChatState> {

    private eventListItems: EventListItemInfo[] = [];
    private virtualListView: VirtualListView<VirtualListViewItemInfo> | undefined;
    private endToken = '';
    private timelineLimited = false;
    private newRedactionSubscription: number;
    private newMessageSubscription: number;
    private newReadReceiptSubscription: number;
    private readMarkerTime = 0;
    private language: Languages = 'en';
    private locale: Locale;

    constructor(props: RoomChatProps) {
        super(props);

        this.newRedactionSubscription = DataStore.subscribe(this.newMessageRedaction, DataStore.RedactionTrigger);
        this.newMessageSubscription = DataStore.subscribe(this.newMessages, DataStore.MessageTrigger);
        this.newReadReceiptSubscription = DataStore.subscribe(this.newReadReceipt, DataStore.ReadReceiptTrigger);

        this.language = UiStore.getLanguage();
        this.locale = UiStore.getLocale();
    }

    protected _buildState(nextProps: RoomChatProps, initState: boolean): Partial<RoomChatState> | undefined {

        const partialState: Partial<RoomChatState> = {};

        partialState.offline =  UiStore.getOffline();

        if (initState || this.props.roomId !== nextProps.roomId) {

            this.readMarkerTime = DataStore.getReadMarker(nextProps.roomId);

            this.eventListItems = DataStore.getAllRoomEvents(nextProps.roomId).map((event) => {

                const messageInfo: EventListItemInfo = {
                    key: event.eventId + Math.random(),
                    height: MESSAGE_HEIGHT_DEFAULT,
                    template: 'event',
                    measureHeight: true,
                    event: event,
                    readMarkerType: event.time > this.readMarkerTime ? 'sent' : 'read',
                    isRedacted: event.isRedacted,
                };

                return messageInfo;
            });

            this.endToken = DataStore.getTimelineToken(nextProps.roomId)!;
            this.timelineLimited = DataStore.getTimelineLimited(nextProps.roomId)!;

            if (nextProps.tempForwardedMessage && nextProps.tempForwardedMessage.message) {

                const content = nextProps.tempForwardedMessage.message.content;

                let body: string | undefined;
                if (content.msgtype === 'm.text') {
                    body = content.body;
                } else {
                    body = '[Sending ' + content.body! + ']';
                }

                partialState.eventListItems = this.createTempEventListItems(body!, nextProps.tempForwardedMessage.tempId);

            } else {

                partialState.eventListItems = this.eventListItems;
            }

            partialState.showArrowButton = false;
            partialState.showLoadingButton = false;
            partialState.showNewMessageButton = false;
            partialState.showMoreButton = false;

            if (!partialState.offline) {
                this.sendInitialReadReceipt();
            }

            if (!initState && this.virtualListView) {
                this.virtualListView.scrollToTop(true, 0);
            }

        } else if (nextProps.tempSentMessage !== this.props.tempSentMessage) {

            const body = nextProps.tempSentMessage.body;
            const tempId = nextProps.tempSentMessage.tempId;
            const body_ = this.props.tempSentMessage ? this.props.tempSentMessage.body : undefined;
            const tempId_ = this.props.tempSentMessage ? this.props.tempSentMessage.tempId : undefined;

            if (body && (!body_ || (tempId !== tempId_))) {

                partialState.eventListItems = this.createTempEventListItems(body, tempId!);

            } else if (!body && body_ && tempId === tempId_) {

                partialState.eventListItems = this.eventListItems;
            }

        } else if (nextProps.tempForwardedMessage !== this.props.tempForwardedMessage) {

            const content = nextProps.tempForwardedMessage.message.content;
            const tempId = nextProps.tempForwardedMessage.tempId;
            const content_ = this.props.tempForwardedMessage ? this.props.tempForwardedMessage.message.content : undefined;
            const tempId_ = this.props.tempForwardedMessage ? this.props.tempForwardedMessage.tempId : undefined;

            if (content) {

                let body: string | undefined;
                if (content.msgtype === 'm.text') {
                    body = content.body;
                } else {
                    body = '[Sending ' + content.body! + ']';
                }

                partialState.eventListItems = this.createTempEventListItems(body!, nextProps.tempForwardedMessage.tempId);

            } else if (!content && content_ && tempId === tempId_) {

                partialState.eventListItems = this.eventListItems;
            }
        }

        return partialState;
    }

    public componentDidMount(): void {

        super.componentDidMount();

        if (this.virtualListView) { this.virtualListView.scrollToTop(true, 0); }
    }

    public componentWillUnmount(): void {

        super.componentWillUnmount();

        DataStore.unsubscribe(this.newRedactionSubscription);
        DataStore.unsubscribe(this.newMessageSubscription);
        DataStore.unsubscribe(this.newReadReceiptSubscription);
    }

    private createTempEventListItems = (body: string, tempId: string): EventListItemInfo[] => {

        // check if the forwarded message is already somewhere near the top of the message list..
        for (let i = 0; i < Math.min(5, this.eventListItems.length); i++) {

            if (this.eventListItems[i].event.tempId === tempId) {
                return this.eventListItems;
            }
        }

        const eventContent: MessageEventContent_ = {
            msgtype: 'm.text',
            body: body,
        }

        const tempMessageEvent: MessageEvent = {
            eventId: tempId,
            content: eventContent,
            type: 'm.room.message',
            time: Date.now(),
            senderId: ApiClient.credentials.userIdFull,
            tempId: 'tempSentMessage'
        }

        const tempMessageInfo: EventListItemInfo = {
            key: tempId,
            height: MESSAGE_HEIGHT_DEFAULT,
            template: 'event',
            measureHeight: true,
            event: tempMessageEvent,
            readMarkerType: 'sending',
        };

        return [tempMessageInfo].concat(this.eventListItems);
    }

    private newMessageRedaction = () => {

        const lastRedactedEventId = DataStore.getLastRedactedEventId(this.props.roomId);

        if (lastRedactedEventId) {

            const eventIndex = this.eventListItems.findIndex(eventItem => eventItem.event.eventId === lastRedactedEventId);

            this.eventListItems[eventIndex].isRedacted = true;

            // HACK: need to cut and repaste the last message to force a re-render of the VLV
            // voodoo: although push does the same as concat, VLV does not update
            const lastItem = this.eventListItems.pop();
            this.eventListItems = this.eventListItems.concat(lastItem!);

            this.setState({ eventListItems: this.eventListItems });
        }
    }

    private newMessages = () => {

        const newRoomEvents = DataStore.getNewRoomEvents(this.props.roomId);
        const newEventsLimited = DataStore.getNewEventsLimited(this.props.roomId);

        const newEventListItems = newRoomEvents.map((event) => {

            const messageInfo: EventListItemInfo = {
                key: event.tempId || (event.eventId + Math.random()),
                height: MESSAGE_HEIGHT_DEFAULT,
                template: 'event',
                measureHeight: true,
                event: event,
                readMarkerType: event.time > this.readMarkerTime ? 'sent' : 'read',
            };

            return messageInfo;
        });

        if (newEventListItems.length > 0 && (newRoomEvents[0].eventId !== this.eventListItems[0].event.eventId)) {

            if (newEventsLimited) {

                this.eventListItems = newEventListItems;
                this.endToken = DataStore.getTimelineToken(this.props.roomId)!;
                this.timelineLimited = true;

            } else {

                this.eventListItems = newEventListItems.concat(this.eventListItems);
            }
            // voodoo: although unshift does the same as concat, it crashes the VLV
            // with error: Active Cell not found for key...
            // this.eventListItems.unshift(newEventInfo);

            if (this.state.showArrowButton) { this.setState({ showNewMessageButton: true }); }

            /*
            According to the ReactXP doc, the VLV should not move when items get added to the top of the list
            while being outside the viewport. This prevents the VLV to jerk or jump as users have
            scrolled down to view older items. From the doc:
            "When items are added before or after the visible region,
            it attempts to maintain the current position of the visible items,
            adjusting the scroll position and list height as necessary."
            Unfortunately it doesn't work. To remedy that problem, the state change is only triggered
            if user is close to the top of the list, and actualised when user either scrolls back up,
            or presses the Up button.
            */

            if (!this.state.showArrowButton) {
                ApiClient.sendReadReceipt(this.props.roomId, newRoomEvents[0].eventId).catch(_error => null);
                this.setState({ eventListItems: this.eventListItems });
            }
        }
    }

    private newReadReceipt = () => {

        const readMarkerTime = DataStore.getReadMarker(this.props.roomId);

        if (readMarkerTime > this.readMarkerTime) {

            this.readMarkerTime = readMarkerTime;

            let newReadItem = false;

            for (let i = 0; i < this.eventListItems.length; i++) {

                if (this.eventListItems[i].readMarkerType === 'read') {
                    break;
                } else if (this.readMarkerTime >= this.eventListItems[i].event.time) {
                    newReadItem = true;
                    this.eventListItems[i].readMarkerType = 'read';
                }
            }

            if (newReadItem) {

                // HACK: need to cut and repaste the last message to force a re-render of the VLV
                // voodoo: although push does the same as concat, VLV does not update
                const lastItem = this.eventListItems.pop();
                this.eventListItems = this.eventListItems.concat(lastItem!);

                if (!this.state.showArrowButton) {
                    this.setState({ eventListItems: this.eventListItems });
                }
            }
        }
    }

    private sendInitialReadReceipt = () => {

        this.eventListItems.some(item => {
            if (item.event.senderId !== ApiClient.credentials.userIdFull) {
                DataStore.setUnread(this.props.roomId, 0);
                ApiClient.sendReadReceipt(this.props.roomId, item.event.eventId).catch(_error => null);
                return true;
            }
            return false;
        });
    }

    private renderItem = (cellRender: VirtualListViewCellRenderDetails<EventListItemInfo>): ReactElement => {

        let dateTile: ReactElement | undefined;
        let messageDateString = '';

        if (cellRender.item.event.dateChangeFlag && !isToday(cellRender.item.event.time)) {

            if (isYesterday(cellRender.item.event.time)) {

                messageDateString = yesterdayWord[this.language];

            } else if (!isSameYear(new Date(), cellRender.item.event.time)
                && differenceInDays(new Date(), cellRender.item.event.time) > 180) {

                messageDateString = format(cellRender.item.event.time, 'd MMMM yyyy', { locale: this.locale });

            } else {

                messageDateString = format(cellRender.item.event.time, 'EEEE, d MMMM', { locale: this.locale });
            }

            dateTile = (
                <RX.View style={ styles.containerDate }>
                    <RX.Text style={ styles.date }>
                        { messageDateString }
                    </RX.Text>
                </RX.View>
            );
        }

        let MessageWrapper: ReactElement;

        if (['m.room.message', 'm.room.encrypted'].includes(cellRender.item.event.type)) {

            MessageWrapper = (
                <RX.View
                    style={ styles.containerWrapper }
                    onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    { dateTile }
                    <MessageTile
                        roomId={ this.props.roomId }
                        key={ cellRender.item.event.eventId }
                        event={ cellRender.item.event }
                        roomType={ this.props.roomType }
                        readMarkerType={ cellRender.item.readMarkerType }
                        setReplyMessage={ this.props.setReplyMessage }
                        showTempForwardedMessage={ this.props.showTempForwardedMessage }
                        canPress={ true }
                        isRedacted={ cellRender.item.isRedacted || false }
                    />
                </RX.View>
            );

        } else {

            const systemMessage = EventUtils.getSystemMessage(cellRender.item.event, this.props.roomType);

            MessageWrapper = (
                <RX.View
                    style={ styles.containerWrapper }
                    onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    { dateTile }
                    <SystemMessage
                        key={ cellRender.item.event.eventId + Math.random() }
                        systemMessage={ systemMessage }
                    />
                </RX.View>
            );
        }

        return MessageWrapper;
    }

    private onScroll = (scrollHeight: number) => {

        if (!this.state.showArrowButton && scrollHeight > 100) {
            this.setState({ showArrowButton: true });
        } else if (this.state.showArrowButton && scrollHeight <= 100) {
            ApiClient.sendReadReceipt(this.props.roomId, this.eventListItems[0].event.eventId).catch(_error => null);
            this.setState({
                eventListItems: this.eventListItems,
                showArrowButton: false,
                showNewMessageButton: false
            });
        }

        // @ts-ignore
        const distanceToBottom = this.virtualListView!._containerHeight - scrollHeight - this.virtualListView!._layoutHeight;

        if (!this.state.showMoreButton && !this.state.showLoadingButton && distanceToBottom < 20) {

            if (this.endToken && this.timelineLimited) {
                this.setState({ showMoreButton: true });
            }

        } else if (this.state.showMoreButton && distanceToBottom >= 20) {

            this.setState({ showMoreButton: false });
        }
    }

    private onPressArrowButton = () => {

        this.virtualListView!.scrollToTop(true, 0);
        ApiClient.sendReadReceipt(this.props.roomId, this.eventListItems[0].event.eventId).catch(_error => null);
        this.setState({ eventListItems: this.eventListItems });
    }

    private onPressMoreButton = () => {

        this.setState({
            showMoreButton: false,
            showLoadingButton: true,
        });

        const previousEventTime = this.eventListItems.length > 0 ? this.eventListItems[this.eventListItems.length - 1].event.time : 0;

        ApiClient.getRoomEvents(this.props.roomId, this.props.roomType, MESSAGE_COUNT_ADD, this.endToken, previousEventTime)
            .then(response => {

                this.timelineLimited = response.timelineLimited;
                this.endToken = response.endToken;

                if (response.events.length === 0) {

                    const text = (
                        <RX.Text style={ styles.textDialog }>
                            { noMoreMessages[this.language] }
                        </RX.Text>
                    );

                    RX.Modal.show(<DialogContainer content={ text }/>, 'modaldialog');

                    this.setState({ showLoadingButton: false });
                    return;
                }

                const olderEventListItems = response.events.map((event) => {

                    const messageInfo: EventListItemInfo = {
                        key: event.eventId + Math.random(),
                        height: MESSAGE_HEIGHT_DEFAULT,
                        template: 'event',
                        measureHeight: true,
                        event: event,
                        readMarkerType: event.time > this.readMarkerTime ? 'sent' : 'read',
                        isRedacted: event.isRedacted,
                    };

                    return messageInfo;
                });

                // simplistic duplicate check
                // if (olderEventListItems[0].event.eventId === this.eventListItems[this.eventListItems.length - 1].event.eventId) {
                //     olderEventListItems.shift();
                // }

                this.eventListItems = this.eventListItems.concat(olderEventListItems);

                this.setState({
                    eventListItems: this.eventListItems,
                    showLoadingButton: false,
                });
            })
            .catch(_error => {
                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { errorLoadingMessages[this.language] }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'modaldialog');

                this.setState({ showLoadingButton: false });
            });
    }

    private onLayout = () => {

        const showMoreButton = () => {

            if (!this.virtualListView) { return }

            // @ts-ignore
            const isNoScroll = this.virtualListView._heightOfRenderBlock < this.virtualListView._layoutHeight;

            if (isNoScroll && this.endToken && this.timelineLimited) { this.setState({ showMoreButton: true }) }
        }

        setTimeout(showMoreButton, 1000);
    }

    public render(): JSX.Element | null {

        if (!this.props.roomType) { return null; }

        let arrowButton: ReactElement | undefined;

        if (this.state.showArrowButton) {

            const iconColor = this.state.showNewMessageButton ? BUTTON_UNREAD_BACKGROUND : LOGO_BACKGROUND;

            arrowButton = (
                <RX.View style={ styles.containerArrowButton }>
                    <RX.Button
                        style={ [styles.roundButton, { borderColor: iconColor }] }
                        onPress={ this.onPressArrowButton }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                    >
                        <IconSvg
                            source= { require('../resources/svg/arrow_up.json') as SvgFile }
                            fillColor={ iconColor }
                            height={ 16 }
                            width={ 16 }
                        />
                    </RX.Button>
                </RX.View>
            );
        }

        let moreButton: ReactElement | undefined;

        if (this.state.showMoreButton) {

            moreButton = (
                <RX.View style={ styles.containerMoreButton }>
                    <RX.Button
                        style={ styles.roundButton }
                        onPress={ this.onPressMoreButton }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                        disabled={ this.state.offline }
                        disabledOpacity={ 0.15 }
                    >
                        <RX.View style={ styles.containerIcon }>
                            <RX.Text style={ styles.moreButtonText }>
                                ...
                            </RX.Text>
                        </RX.View>
                    </RX.Button>
                </RX.View>
            );
        }

        let loadingButton: ReactElement | undefined;

        if (this.state.showLoadingButton) {

            loadingButton = (
                <RX.View style={ styles.containerLoadingButton }>
                    <RX.View style={ styles.loadingButton }>
                        <RX.Text style={ styles.loadingButtonText }>
                            { fetchingMessages[this.language] }
                        </RX.Text>
                        <RX.View style={ styles.spinner }>
                            <Spinner size={ 'small' } color={ BUTTON_LONG_TEXT } isVisible={ true } />
                        </RX.View>
                    </RX.View>
                </RX.View>
            );
        }

        let backgroundImage: string;

        switch (RX.UserInterface.getPixelRatio()) {
            case 1:
                backgroundImage = background100 as string;
                break;

            case 2:
                backgroundImage = background200 as string;
                break;

            case 4:
                backgroundImage = background400 as string;
                break;

            case 6:
                backgroundImage = background600 as string;
                break;

            default:
                backgroundImage = background800 as string;
                break;
        }

        return (

            <RX.View
                style={ styles.container }
                onPress={ () => RX.UserInterface.dismissKeyboard() }
            >

                <RX.View style={ styles.background }>
                    <RX.Image
                        resizeMethod={ 'resize' }
                        resizeMode={ 'repeat' }
                        style={ styles.image }
                        source={ backgroundImage }
                    />
                </RX.View>

                <VirtualListView
                    onScroll={ this.onScroll }
                    ref={ component => this.virtualListView = component! }
                    itemList={ this.state.eventListItems }
                    renderItem={ this.renderItem }
                    skipRenderIfItemUnchanged={ true }
                    animateChanges={ true }
                    onLayout={ this.onLayout }
                    keyboardShouldPersistTaps={ true }
                />

                { arrowButton }

                { moreButton }

                { loadingButton }

            </RX.View>
        );
    }
}
