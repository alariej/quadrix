import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { ComponentBase } from 'resub';
import DataStore from '../stores/DataStore';
import RoomTile from '../components/RoomTile';
import { BUTTON_ROUND_WIDTH, BUTTON_UNREAD_BACKGROUND, HEADER_HEIGHT, LOGO_BACKGROUND, OPAQUE_DUMMY_BACKGROUND,
    SPACING, TILE_HEIGHT, TRANSPARENT_BACKGROUND } from '../ui';
import RoomListHeader from '../components/RoomListHeader';
import { VirtualListView, VirtualListViewItemInfo, VirtualListViewCellRenderDetails } from 'reactxp-virtuallistview';
import UiStore from '../stores/UiStore';
import { MessageEvent } from '../models/MessageEvent';
import SpinnerUtils from '../utils/SpinnerUtils';
import IconSvg, { SvgFile } from '../components/IconSvg';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
    }),
    roomWrapper: RX.Styles.createViewStyle({
        backgroundColor: OPAQUE_DUMMY_BACKGROUND,
    }),
    containerArrowButton: RX.Styles.createViewStyle({
        position: 'absolute',
        top: HEADER_HEIGHT + SPACING + 12,
        right: 12,
        width: BUTTON_ROUND_WIDTH,
        height: BUTTON_ROUND_WIDTH,
        backgroundColor: TRANSPARENT_BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
    }),
    roundButton: RX.Styles.createViewStyle({
        width: BUTTON_ROUND_WIDTH - 10,
        height: BUTTON_ROUND_WIDTH - 10,
        borderRadius: (BUTTON_ROUND_WIDTH - 10) / 2,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.8
    }),
};

interface RoomListProps extends RX.CommonProps {
    showRoom: (roomId: string) => void;
    showLogin: () => void;
}

interface RoomListItemInfo extends VirtualListViewItemInfo {
    room: { id: string, newEvents: MessageEvent[] };
    newestEvent: MessageEvent;
}

interface RoomListState {
    roomListItems: RoomListItemInfo[];
    showArrowButton: boolean;
    totalUnreadCount: number;
    syncComplete: boolean;
    offline: boolean;
    appColor: string;
}

export default class RoomList extends ComponentBase<RoomListProps, RoomListState> {

    private prevSelectedRoom = '';
    private virtualListView: VirtualListView<VirtualListViewItemInfo> | undefined;

    protected _buildState(_nextProps: RoomListProps, initState: boolean, _prevState: RoomListState): Partial<RoomListState> {

        const partialState: Partial<RoomListState> = {};

        if (initState) {
            partialState.showArrowButton = false;
        }

        partialState.appColor = UiStore.getAppColor();

        partialState.syncComplete = DataStore.getSyncComplete();

        if (partialState.syncComplete && SpinnerUtils.isDisplayed('syncspinner')) {
            SpinnerUtils.dismissModalSpinner('syncspinner');
        }

        const sortedRoomList =  DataStore.getSortedRoomList();

        const selectedRoom = UiStore.getSelectedRoom();
        if (selectedRoom === '' && this.prevSelectedRoom !== '') {
            this.virtualListView?.scrollToTop();
        }
        this.prevSelectedRoom = selectedRoom;

        let unreadCount = 0;
        partialState.roomListItems = sortedRoomList.map((room) => {

            unreadCount += room.unreadCount;

            const roomInfo: RoomListItemInfo = {
                key: room.id,
                height: TILE_HEIGHT + SPACING,
                template: 'room',
                room: room,
                newestEvent: room.newEvents[0],
                measureHeight: false,
            };

            return roomInfo;
        });

        partialState.totalUnreadCount = unreadCount;
        partialState.offline = UiStore.getOffline();

        return partialState;
    }

    public componentDidMount(): void {
        super.componentDidMount();

        if (!this.state.syncComplete) {
            SpinnerUtils.showModalSpinner('syncspinner');
        }
    }

    private onScroll = (scrollHeight: number) => {

        if (!this.state.showArrowButton && scrollHeight > 100) {
            this.setState({ showArrowButton: true });
        } else if (this.state.showArrowButton && scrollHeight <= 100) {
            this.setState({ showArrowButton: false });
        }
    }

    private onPressArrowButton = () => {

        this.virtualListView!.scrollToTop(true, 0);
    }

    private renderItem = (cellRender: VirtualListViewCellRenderDetails<RoomListItemInfo>) => {

        const roomWrapper = (
            <RX.View
                style={ styles.roomWrapper }
                onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                disableTouchOpacityAnimation={ true }
                activeOpacity={ 1 }
            >
                <RoomTile
                    key={ cellRender.item.room.id }
                    roomId={ cellRender.item.room.id }
                    newestRoomEvent={ cellRender.item.newestEvent }
                    onPressRoom={ this.props.showRoom }
                />
            </RX.View>
        );

        return roomWrapper;
    }

    public render(): JSX.Element | null {

        let arrowButton: ReactElement | undefined;

        if (this.state.showArrowButton) {

            const iconColor = this.state.totalUnreadCount ? BUTTON_UNREAD_BACKGROUND : LOGO_BACKGROUND;

            arrowButton = (
                <RX.View
                    style={ styles.containerArrowButton }
                    onPress={ this.onPressArrowButton }
                >
                    <RX.Button
                        style={ [styles.roundButton, { backgroundColor: iconColor }] }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                    >
                        <IconSvg
                            source= { require('../resources/svg/arrow_up.json') as SvgFile }
                            fillColor={ this.state.appColor }
                            height={ 12 }
                            width={ 12 }
                        />
                    </RX.Button>
                </RX.View>
            );
        }

        return (
            <RX.View style={ styles.container }>

                <RoomListHeader
                    showLogin={ this.props.showLogin }
                    showRoom={ this.props.showRoom }
                />

                <VirtualListView
                    onScroll={ this.onScroll }
                    ref={ component => this.virtualListView = component! }
                    itemList={ this.state.roomListItems }
                    renderItem={ this.renderItem }
                    skipRenderIfItemUnchanged={ true }
                    animateChanges={ true }
                />

                { arrowButton }

            </RX.View>
        );
    }
}
