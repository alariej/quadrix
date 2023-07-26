import React from 'react';
import RX from 'reactxp';
import DataStore from '../stores/DataStore';
import RoomTile from '../components/RoomTile';
import {
	HEADER_TEXT,
	OPAQUE_BACKGROUND,
	BORDER_RADIUS,
	TILE_WIDTH,
	SPACING,
	TILE_HEIGHT,
	FONT_LARGE,
	LOGO_FILL,
} from '../ui';
import UiStore from '../stores/UiStore';
import AppFont from '../modules/AppFont';

const styles = {
	modalScreen: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		justifyContent: 'center',
	}),
	modalView: RX.Styles.createViewStyle({
		alignSelf: 'center',
		justifyContent: 'center',
		width: TILE_WIDTH,
		maxHeight: 360, // TODO: make this dynamic
	}),
	label: RX.Styles.createViewStyle({
		alignSelf: 'center',
		borderRadius: BORDER_RADIUS,
		width: TILE_WIDTH,
		marginBottom: 1,
		padding: SPACING,
		backgroundColor: LOGO_FILL,
	}),
	labelText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		color: HEADER_TEXT,
		textAlign: 'center',
	}),
};

interface DialogRoomPickerProps {
	onPressRoom: (roomId: string) => void;
	label: string;
	backgroundColor?: string;
}

export default class DialogRoomPicker extends RX.Component<DialogRoomPickerProps, RX.Stateless> {
	public render(): JSX.Element | null {
		const sortedRoomList = DataStore.getSortedRoomList();

		const roomTiles = sortedRoomList
			.filter(room => room.active)
			.map(room => {
				return (
					<RoomTile
						key={room.id}
						roomId={room.id}
						onPressRoom={this.props.onPressRoom}
						newestRoomEvent={room.latestFilteredEvent}
					/>
				);
			});

		return (
			<RX.View
				style={[styles.modalScreen, { backgroundColor: this.props.backgroundColor || OPAQUE_BACKGROUND }]}
				onPress={() => RX.Modal.dismissAll()}
			>
				<RX.View
					style={styles.label}
					onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					<RX.Text style={styles.labelText}>{this.props.label}</RX.Text>
				</RX.View>
				<RX.View
					style={[styles.modalView, { height: roomTiles.length * (TILE_HEIGHT + SPACING) }]}
					onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					<RX.ScrollView style={{ width: UiStore.getPlatform() === 'web' ? TILE_WIDTH + 30 : TILE_WIDTH }}>
						{roomTiles}
					</RX.ScrollView>
				</RX.View>
			</RX.View>
		);
	}
}
