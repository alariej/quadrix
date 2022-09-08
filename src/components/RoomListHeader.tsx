import React, { ReactElement } from 'react';
import RX from 'reactxp';
import DataStore from '../stores/DataStore';
import { ComponentBase } from 'resub';
import {
	TILE_SYSTEM_TEXT,
	MODAL_CONTENT_TEXT,
	HEADER_HEIGHT,
	FONT_NORMAL,
	FONT_LARGE,
	SPACING,
	BUTTON_FILL,
	TRANSPARENT_BACKGROUND,
	HEADER_STATUS,
	PAGE_MARGIN,
	BUTTON_HEADER_WIDTH,
	BUTTON_HEADER_MARGIN,
} from '../ui';
import ApiClient from '../matrix/ApiClient';
import DialogNewRoom from '../dialogs/DialogNewRoom';
import DialogContainer from '../modules/DialogContainer';
import DialogSettings from '../dialogs/DialogSettings';
import UiStore from '../stores/UiStore';
import { pressOKToLogout, cancel, Languages } from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import Pushers from '../modules/Pushers';
import AppFont from '../modules/AppFont';
import FileHandler from '../modules/FileHandler';
import DialogMenuMain from '../dialogs/DialogMenuMain';
import About from './About';

const styles = {
	container: RX.Styles.createViewStyle({
		flexDirection: 'row',
		height: HEADER_HEIGHT,
		marginBottom: 1,
	}),
	containerHeader: RX.Styles.createViewStyle({
		flex: 1,
		justifyContent: 'center',
		backgroundColor: TRANSPARENT_BACKGROUND,
	}),
	userIdContainer: RX.Styles.createViewStyle({
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
	}),
	userId: RX.Styles.createTextStyle({
		textAlign: 'center',
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: HEADER_STATUS,
		paddingBottom: 1,
	}),
	roundButton: RX.Styles.createViewStyle({
		borderRadius: (BUTTON_HEADER_WIDTH + BUTTON_HEADER_MARGIN) / 2,
		width: BUTTON_HEADER_WIDTH + BUTTON_HEADER_MARGIN,
		height: BUTTON_HEADER_WIDTH + BUTTON_HEADER_MARGIN,
		justifyContent: 'center',
		alignItems: 'center',
	}),
	connectedContainer: RX.Styles.createViewStyle({
		position: 'absolute',
		height: 14,
		width: 14,
		top: SPACING,
		left: SPACING,
	}),
	logoutTextDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		textAlign: 'center',
		color: MODAL_CONTENT_TEXT,
		marginVertical: 12,
		marginHorizontal: 24,
	}),
	bracketLeft: RX.Styles.createViewStyle({
		height: 22,
		width: 3,
		borderColor: HEADER_STATUS,
		opacity: 0.5,
		borderLeftWidth: 1,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderRightWidth: 0,
		marginRight: SPACING,
	}),
	bracketRight: RX.Styles.createViewStyle({
		height: 22,
		width: 3,
		borderColor: HEADER_STATUS,
		opacity: 0.5,
		borderLeftWidth: 0,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderRightWidth: 1,
		marginLeft: SPACING,
	}),
};

interface RoomListHeaderProps extends RX.CommonProps {
	showLogin: () => void;
	showRoom: (roomId: string) => void;
}

interface RoomListHeaderState {
	offline: boolean;
	isJitsiMaximised: boolean;
}

export default class RoomListHeader extends ComponentBase<RoomListHeaderProps, RoomListHeaderState> {
	private language: Languages = 'en';

	constructor(props: RoomListHeaderProps) {
		super(props);

		this.language = UiStore.getLanguage();
	}

	protected _buildState(): RoomListHeaderState {
		if (UiStore.getUnknownAccessToken()) {
			this.logout().catch(_error => null);
		}

		return {
			offline: UiStore.getOffline(),
			isJitsiMaximised: UiStore.getJitsiMaximised(),
		};
	}

	private logout = async () => {
		RX.Modal.dismissAll();

		Pushers.removeFromDevice(ApiClient.credentials).catch(_error => null);

		ApiClient.stopSync();
		ApiClient.clearNextSyncToken();
		FileHandler.clearCacheAppFolder();
		await ApiClient.clearStorage();
		await ApiClient.storeLastUserId();
		DataStore.clearRoomSummaryList();

		this.props.showLogin();
	};

	private onPressLogout = () => {
		const text = <RX.Text style={styles.logoutTextDialog}>{pressOKToLogout[this.language]}</RX.Text>;

		const logoutConfirmation = (
			<DialogContainer
				content={text}
				confirmButton={true}
				confirmButtonText={'OK'}
				cancelButton={true}
				cancelButtonText={cancel[this.language]}
				onConfirm={this.logout}
				onCancel={() => RX.Modal.dismissAll()}
			/>
		);

		RX.Modal.show(logoutConfirmation, 'logoutConfirmation');
	};

	private onPressSettings = () => {
		RX.Modal.show(<DialogSettings showLogin={this.props.showLogin} />, 'dialogsettings');
	};

	private onPressAbout = () => {
		const about = <About />;

		const versionDialog = (
			<DialogContainer
				content={about}
				confirmButton={false}
				cancelButton={false}
				onCancel={() => RX.Modal.dismissAll()}
			/>
		);

		RX.Modal.show(versionDialog, 'versionDialog');
	};

	private onPressNewChat = () => {
		RX.Modal.show(<DialogNewRoom showRoom={this.props.showRoom} />, 'dialognewroom');
	};

	private showMenu = () => {
		const dialogMenuMain = (
			<DialogMenuMain
				onPressNewChat={this.onPressNewChat}
				onPressSettings={this.onPressSettings}
				onPressAbout={this.onPressAbout}
				onPressLogout={this.onPressLogout}
			/>
		);

		RX.Modal.show(dialogMenuMain, 'dialog_menu_main');
	};

	public render(): JSX.Element | null {
		let disconnected: ReactElement;
		if (this.state.offline) {
			disconnected = (
				<RX.View style={styles.connectedContainer}>
					<IconSvg
						source={require('../resources/svg/RI_nochat.json') as SvgFile}
						fillColor={TILE_SYSTEM_TEXT}
						height={14}
						width={14}
					/>
				</RX.View>
			);
		}

		const width =
			UiStore.getAppLayout_().pageWidth -
			2 * PAGE_MARGIN -
			1 * (BUTTON_HEADER_WIDTH + BUTTON_HEADER_MARGIN + SPACING) -
			2 * 4 -
			2 * SPACING;

		return (
			<RX.View style={styles.container}>
				{disconnected!}
				<RX.View
					style={styles.containerHeader}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					<RX.View style={styles.userIdContainer}>
						<RX.View style={styles.bracketLeft} />
						<RX.Text
							style={[styles.userId, { maxWidth: width }]}
							allowFontScaling={false}
							numberOfLines={1}
						>
							{ApiClient.credentials.userIdFull}
						</RX.Text>
						<RX.View style={styles.bracketRight} />
					</RX.View>
				</RX.View>
				<RX.Button
					style={styles.roundButton}
					onPress={() => (this.state.isJitsiMaximised ? null : this.showMenu())}
					disableTouchOpacityAnimation={false}
					underlayColor={BUTTON_FILL}
					activeOpacity={0.8}
				>
					<IconSvg
						source={require('../resources/svg/RI_menu.json') as SvgFile}
						style={{ marginBottom: 1 }}
						fillColor={BUTTON_FILL}
						height={BUTTON_HEADER_WIDTH}
						width={BUTTON_HEADER_WIDTH}
					/>
				</RX.Button>
			</RX.View>
		);
	}
}
