import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { ComponentBase } from 'resub';
import DataStore from '../stores/DataStore';
import RoomTile from '../components/RoomTile';
import {
	BUTTON_ROUND_WIDTH,
	BUTTON_UNREAD_BACKGROUND,
	HEADER_HEIGHT,
	BUTTON_FILL,
	OPAQUE_DUMMY_BACKGROUND,
	SPACING,
	TILE_HEIGHT,
	TRANSPARENT_BACKGROUND,
	CONTENT_BACKGROUND,
} from '../ui';
import RoomListHeader from '../components/RoomListHeader';
import {
	VirtualListView,
	VirtualListViewCellRenderDetails,
	VirtualListViewItemInfo,
} from '../components/VirtualListView';
import UiStore from '../stores/UiStore';
import SpinnerUtils from '../utils/SpinnerUtils';
import IconSvg, { SvgFile } from '../components/IconSvg';
import { RoomSummary } from '../models/RoomSummary';
import { FilteredChatEvent } from '../models/FilteredChatEvent';
import { MessageEventContent_ } from '../models/MatrixApi';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		backgroundColor: CONTENT_BACKGROUND,
	}),
	roomWrapper: RX.Styles.createViewStyle({
		backgroundColor: OPAQUE_DUMMY_BACKGROUND,
	}),
	arrowButton: RX.Styles.createViewStyle({
		position: 'absolute',
		top: HEADER_HEIGHT + SPACING + 12,
		right: 12,
		borderRadius: BUTTON_ROUND_WIDTH / 2,
		width: BUTTON_ROUND_WIDTH,
		height: BUTTON_ROUND_WIDTH,
		backgroundColor: TRANSPARENT_BACKGROUND,
		justifyContent: 'center',
		alignItems: 'center',
		cursor: 'pointer',
	}),
};

interface RoomListProps extends RX.CommonProps {
	showRoom: (roomId: string) => void;
	showLogin: () => void;
}

interface RoomListItemInfo extends VirtualListViewItemInfo {
	room: RoomSummary;
	latestFilteredEvent: FilteredChatEvent;
	isRedacted: boolean;
	body: string;
}

interface RoomListState {
	roomListItems: RoomListItemInfo[];
	showArrowButton: boolean;
	totalUnreadCount: number;
	syncComplete: boolean;
	offline: boolean;
}

export default class RoomList extends ComponentBase<RoomListProps, RoomListState> {
	private virtualListView: VirtualListView<VirtualListViewItemInfo> | undefined;

	protected _buildState(
		_nextProps: RoomListProps,
		initState: boolean,
		_prevState: RoomListState
	): Partial<RoomListState> {
		const partialState: Partial<RoomListState> = {};

		if (initState) {
			partialState.showArrowButton = false;
		}

		partialState.syncComplete = DataStore.getSyncComplete();

		if (partialState.syncComplete && SpinnerUtils.isDisplayed('syncspinner')) {
			SpinnerUtils.dismissModalSpinner('syncspinner');
		}

		const sortedRoomList = DataStore.getSortedRoomList();

		let unreadCount = 0;
		partialState.roomListItems = sortedRoomList.map(room => {
			unreadCount += room.unreadCount;

			const roomInfo: RoomListItemInfo = {
				key: room.id,
				height: TILE_HEIGHT + 1,
				template: 'room',
				room: room,
				latestFilteredEvent: room.latestFilteredEvent!,
				isRedacted: room.latestFilteredEvent?.isRedacted || false,
				body: (room.latestFilteredEvent?.content as MessageEventContent_)?.body || '',
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

		if (!this.state.syncComplete && !RX.Modal.isDisplayed('modal_cleardatastore')) {
			SpinnerUtils.showModalSpinner('syncspinner');
		}
	}

	private onScroll = (scrollHeight: number) => {
		if (!this.state.showArrowButton && scrollHeight > 100) {
			this.setState({ showArrowButton: true });
		} else if (this.state.showArrowButton && scrollHeight <= 100) {
			this.setState({ showArrowButton: false });
		}
	};

	private onPressArrowButton = () => {
		this.virtualListView!.scrollToTop(true, 0);
	};

	private renderItem = (cellRender: VirtualListViewCellRenderDetails<RoomListItemInfo>) => {
		const roomWrapper = (
			<RX.View
				style={styles.roomWrapper}
				onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
				disableTouchOpacityAnimation={true}
				activeOpacity={1}
			>
				<RoomTile
					key={cellRender.item.room.id}
					roomId={cellRender.item.room.id}
					newestRoomEvent={cellRender.item.latestFilteredEvent}
					onPressRoom={this.props.showRoom}
				/>
			</RX.View>
		);

		return roomWrapper;
	};

	public render(): JSX.Element | null {
		let arrowButton: ReactElement | undefined;

		if (this.state.showArrowButton) {
			const iconColor = this.state.totalUnreadCount ? BUTTON_UNREAD_BACKGROUND : BUTTON_FILL;

			arrowButton = (
				<RX.Button
					style={styles.arrowButton}
					onPress={this.onPressArrowButton}
					disableTouchOpacityAnimation={false}
					underlayColor={iconColor}
					activeOpacity={0.8}
				>
					<IconSvg
						source={require('../resources/svg/RI_arrowup.json') as SvgFile}
						style={{ backgroundColor: iconColor, borderRadius: 11 }}
						fillColor={'white'}
						height={22}
						width={22}
					/>
				</RX.Button>
			);
		}

		return (
			<RX.View style={styles.container}>
				<RoomListHeader
					showLogin={this.props.showLogin}
					showRoom={this.props.showRoom}
				/>
				<VirtualListView
					onScroll={this.onScroll}
					ref={component => (this.virtualListView = component!)}
					itemList={this.state.roomListItems}
					renderItem={this.renderItem}
					skipRenderIfItemUnchanged={true}
					animateChanges={true}
				/>
				{arrowButton}
			</RX.View>
		);
	}
}
