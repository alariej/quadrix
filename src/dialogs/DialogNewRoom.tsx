import React, { ReactElement } from 'react';
import RX from 'reactxp';
import DialogNewGroup from './DialogNewGroup';
import DialogNewNotepad from './DialogNewNotepad';
import DialogNewDirectConversation from './DialogNewDirectConversation';
import DialogJoinCommunity from './DialogJoinCommunity';
import {
	OPAQUE_BACKGROUND,
	DIALOG_WIDTH,
	AVATAR_TILE_WIDTH,
	FONT_LARGE,
	OBJECT_MARGIN,
	STACKED_BUTTON_HEIGHT,
	HEADER_TEXT,
	LIGHT_BACKGROUND,
} from '../ui';
import UiStore from '../stores/UiStore';
import { createNewConv, createNewGroup, joinPublicComm, createNewNote } from '../translations';
import { SvgFile } from '../components/IconSvg';
import AppFont from '../modules/AppFont';
import MenuButton from '../components/MenuButton';

const styles = {
	containerButtons: RX.Styles.createViewStyle({
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
	}),
	buttonDialog: RX.Styles.createViewStyle({
		width: DIALOG_WIDTH,
		height: STACKED_BUTTON_HEIGHT,
		marginBottom: 10,
	}),
	buttonText: RX.Styles.createTextStyle({
		flex: 1,
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		color: HEADER_TEXT,
		marginLeft: OBJECT_MARGIN,
		marginRight: OBJECT_MARGIN,
		textAlign: 'left',
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
				<MenuButton
					buttonStyle={styles.buttonDialog}
					iconSource={require('../resources/svg/RI_public.json') as SvgFile}
					iconFillColor={HEADER_TEXT}
					iconHeight={20}
					iconWidth={20}
					animatedColor={LIGHT_BACKGROUND}
					onPress={event => this.joinCommunity(event)}
					text={joinPublicComm[language]}
					textStyle={styles.buttonText}
					numberOfLines={2}
				/>
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
					<MenuButton
						buttonStyle={styles.buttonDialog}
						iconSource={require('../resources/svg/RI_user.json') as SvgFile}
						iconFillColor={HEADER_TEXT}
						iconHeight={20}
						iconWidth={20}
						animatedColor={LIGHT_BACKGROUND}
						onPress={event => this.startNewConversation(event)}
						text={createNewConv[language]}
						textStyle={styles.buttonText}
						numberOfLines={2}
					/>
					<MenuButton
						buttonStyle={styles.buttonDialog}
						iconSource={require('../resources/svg/RI_users.json') as SvgFile}
						iconFillColor={HEADER_TEXT}
						iconHeight={20}
						iconWidth={20}
						animatedColor={LIGHT_BACKGROUND}
						onPress={event => this.createNewGroup(event)}
						text={createNewGroup[language]}
						textStyle={styles.buttonText}
						numberOfLines={2}
					/>
					{joinCommunityButton!}
					<MenuButton
						buttonStyle={styles.buttonDialog}
						iconSource={require('../resources/svg/RI_notepad.json') as SvgFile}
						iconFillColor={HEADER_TEXT}
						iconHeight={20}
						iconWidth={20}
						animatedColor={LIGHT_BACKGROUND}
						onPress={event => this.createNewNotepad(event)}
						text={createNewNote[language]}
						textStyle={styles.buttonText}
						numberOfLines={2}
					/>
				</RX.View>
			</RX.View>
		);
	}
}
