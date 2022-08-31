import React, { ReactElement } from 'react';
import RX from 'reactxp';
import DialogNewGroup from './DialogNewGroup';
import DialogNewNotepad from './DialogNewNotepad';
import DialogNewDirectConversation from './DialogNewDirectConversation';
import DialogJoinCommunity from './DialogJoinCommunity';
import {
	BUTTON_MODAL_BACKGROUND,
	BUTTON_MODAL_TEXT,
	OPAQUE_BACKGROUND,
	BORDER_RADIUS,
	DIALOG_WIDTH,
	SPACING,
	AVATAR_TILE_WIDTH,
	TILE_HEIGHT,
	FONT_LARGE,
	AVATAR_FOREGROUND,
	OBJECT_MARGIN,
	ICON_REDUCTION_FACTOR,
} from '../ui';
import UiStore from '../stores/UiStore';
import { createNewConv, createNewGroup, joinPublicComm, createNewNote } from '../translations';
import IconSvg, { SvgFile } from '../components/IconSvg';
import AppFont from '../modules/AppFont';

const styles = {
	containerButtons: RX.Styles.createViewStyle({
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
	}),
	containerButton: RX.Styles.createViewStyle({
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: BORDER_RADIUS,
		width: DIALOG_WIDTH,
		height: TILE_HEIGHT,
		backgroundColor: BUTTON_MODAL_BACKGROUND,
		padding: SPACING,
		marginBottom: 1,
		cursor: 'pointer',
	}),
	buttonText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		flex: 1,
		fontSize: FONT_LARGE,
		color: BUTTON_MODAL_TEXT,
		marginRight: OBJECT_MARGIN,
	}),
	modalScreen: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		backgroundColor: OPAQUE_BACKGROUND,
		justifyContent: 'center',
	}),
	containerAvatar: RX.Styles.createViewStyle({
		justifyContent: 'center',
		alignItems: 'center',
		height: AVATAR_TILE_WIDTH,
		width: AVATAR_TILE_WIDTH,
		borderRadius: AVATAR_TILE_WIDTH / 2,
	}),
};

interface DialogNewRoomProps {
	showRoom: (roomId: string) => void;
}

export default class DialogNewRoom extends RX.Component<DialogNewRoomProps, RX.Stateless> {
	private startNewConversation = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		RX.Modal.dismiss('buttonrender');

		RX.Modal.show(<DialogNewDirectConversation showRoom={this.props.showRoom} />, 'createdirectdialog');
	};

	private createNewGroup = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		RX.Modal.dismiss('buttonrender');

		RX.Modal.show(<DialogNewGroup showRoom={this.props.showRoom} />, 'creategroupdialog');
	};
	private joinCommunity = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		RX.Modal.dismiss('buttonrender');

		RX.Modal.show(<DialogJoinCommunity showRoom={this.props.showRoom} />, 'modaldialog_searchcommunity');
	};

	private createNewNotepad = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		RX.Modal.dismiss('buttonrender');

		RX.Modal.show(<DialogNewNotepad showRoom={this.props.showRoom} />, 'createnotepaddialog');
	};

	public render(): JSX.Element | null {
		const language = UiStore.getLanguage();

		let joinCommunityButton: ReactElement | null;

		if (
			(!UiStore.getIsElectron() && UiStore.getPlatform() === 'web') ||
			(UiStore.getIsElectron() && UiStore.getDesktopOS() === 'Linux')
		) {
			joinCommunityButton = (
				<RX.View
					style={styles.containerButton}
					onPress={event => this.joinCommunity(event)}
					disableTouchOpacityAnimation={false}
					activeOpacity={0.8}
				>
					<RX.View style={styles.containerAvatar}>
						<IconSvg
							source={require('../resources/svg/RI_public.json') as SvgFile}
							fillColor={AVATAR_FOREGROUND}
							height={AVATAR_TILE_WIDTH / ICON_REDUCTION_FACTOR}
							width={AVATAR_TILE_WIDTH / ICON_REDUCTION_FACTOR}
						/>
					</RX.View>
					<RX.Text style={styles.buttonText}>{joinPublicComm[language]}</RX.Text>
				</RX.View>
			);
		}

		return (
			<RX.View
				style={styles.modalScreen}
				onPress={() => RX.Modal.dismissAll()}
				disableTouchOpacityAnimation={true}
			>
				<RX.View
					style={styles.containerButtons}
					onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					<RX.View
						style={styles.containerButton}
						onPress={event => this.startNewConversation(event)}
						disableTouchOpacityAnimation={false}
						activeOpacity={0.8}
					>
						<RX.View style={styles.containerAvatar}>
							<IconSvg
								source={require('../resources/svg/RI_user.json') as SvgFile}
								fillColor={AVATAR_FOREGROUND}
								height={AVATAR_TILE_WIDTH / ICON_REDUCTION_FACTOR}
								width={AVATAR_TILE_WIDTH / ICON_REDUCTION_FACTOR}
							/>
						</RX.View>
						<RX.Text style={styles.buttonText}>{createNewConv[language]}</RX.Text>
					</RX.View>
					<RX.View
						style={styles.containerButton}
						onPress={event => this.createNewGroup(event)}
						disableTouchOpacityAnimation={false}
						activeOpacity={0.8}
					>
						<RX.View style={styles.containerAvatar}>
							<IconSvg
								source={require('../resources/svg/RI_users.json') as SvgFile}
								fillColor={AVATAR_FOREGROUND}
								height={AVATAR_TILE_WIDTH / ICON_REDUCTION_FACTOR}
								width={AVATAR_TILE_WIDTH / ICON_REDUCTION_FACTOR}
							/>
						</RX.View>
						<RX.Text style={styles.buttonText}>{createNewGroup[language]}</RX.Text>
					</RX.View>

					{joinCommunityButton!}

					<RX.View
						style={styles.containerButton}
						onPress={event => this.createNewNotepad(event)}
						disableTouchOpacityAnimation={false}
						activeOpacity={0.8}
					>
						<RX.View style={styles.containerAvatar}>
							<IconSvg
								source={require('../resources/svg/RI_notepad.json') as SvgFile}
								fillColor={AVATAR_FOREGROUND}
								height={AVATAR_TILE_WIDTH / ICON_REDUCTION_FACTOR}
								width={AVATAR_TILE_WIDTH / ICON_REDUCTION_FACTOR}
							/>
						</RX.View>
						<RX.Text style={styles.buttonText}>{createNewNote[language]}</RX.Text>
					</RX.View>
				</RX.View>
			</RX.View>
		);
	}
}
