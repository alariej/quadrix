import React from 'react';
import RX from 'reactxp';
import { ComponentBase } from 'resub';
import DataStore from '../stores/DataStore';
import RoomTile from '../components/RoomTile';
import { OPAQUE_DUMMY_BACKGROUND, SPACING, TILE_HEIGHT } from '../ui';
import RoomListHeader from '../components/RoomListHeader';
import { VirtualListView, VirtualListViewItemInfo, VirtualListViewCellRenderDetails } from 'reactxp-virtuallistview';
import UiStore from '../stores/UiStore';
import { MessageEvent } from '../models/MessageEvent';
import SpinnerUtils from '../utils/SpinnerUtils';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
    }),
    roomWrapper: RX.Styles.createViewStyle({
        backgroundColor: OPAQUE_DUMMY_BACKGROUND,
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
    syncComplete: boolean;
    offline: boolean;
}

export default class RoomList extends ComponentBase<RoomListProps, RoomListState> {

    protected _buildState(_nextProps: RoomListProps, _initState: boolean, _prevState: RoomListState): Partial<RoomListState> {

        const partialState: Partial<RoomListState> = {};

        partialState.syncComplete = DataStore.getSyncComplete();

        if (partialState.syncComplete && SpinnerUtils.isDisplayed('syncspinner')) {
            SpinnerUtils.dismissModalSpinner('syncspinner');
        }

        const sortedRoomList =  DataStore.getSortedRoomList();

        partialState.roomListItems = sortedRoomList.map((room) => {

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

        partialState.offline = UiStore.getOffline();

        return partialState;
    }

    public componentDidMount(): void {
        super.componentDidMount();

        if (!this.state.syncComplete) {
            SpinnerUtils.showModalSpinner('syncspinner');
        }
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

        return (
            <RX.View style={ styles.container }>

                <RoomListHeader
                    showLogin={ this.props.showLogin }
                    showRoom={ this.props.showRoom }
                />

                <VirtualListView
                    itemList={ this.state.roomListItems }
                    renderItem={ this.renderItem }
                    skipRenderIfItemUnchanged={ true }
                    animateChanges={ true }
                />

            </RX.View>
        );
    }
}
