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
	TRANSPARENT_BACKGROUND,
	PAGE_MARGIN,
	BUTTON_HEADER_WIDTH,
	BUTTON_HEADER_BACKGROUND,
	LOGO_FILL,
	BUTTON_FILL_HEADER,
	HEADER_TEXT,
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
import AnimatedButton from './AnimatedButton';
import StoreVersion from '../modules/StoreVersion';

const styles = {
	container: RX.Styles.createViewStyle({
		flexDirection: 'row',
		height: HEADER_HEIGHT,
		backgroundColor: LOGO_FILL,
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
		color: HEADER_TEXT,
		paddingBottom: 1,
	}),
	roundButton: RX.Styles.createViewStyle({
		width: HEADER_HEIGHT / 2,
		height: HEADER_HEIGHT / 2,
		borderRadius: HEADER_HEIGHT / 4,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: BUTTON_HEADER_BACKGROUND,
	}),
	infoButton: RX.Styles.createViewStyle({
		width: HEADER_HEIGHT / 2,
		height: HEADER_HEIGHT / 2,
		borderRadius: HEADER_HEIGHT / 4,
		justifyContent: 'center',
		alignItems: 'center',
	}),
	buttonContainer: RX.Styles.createViewStyle({
		marginLeft: SPACING,
	}),
	iconContainer: RX.Styles.createViewStyle({
		width: HEADER_HEIGHT / 2,
		height: HEADER_HEIGHT / 2,
		justifyContent: 'center',
		alignItems: 'center',
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
		borderColor: HEADER_TEXT,
		borderLeftWidth: 1,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderRightWidth: 0,
		marginRight: SPACING,
	}),
	bracketRight: RX.Styles.createViewStyle({
		height: 22,
		width: 3,
		borderColor: HEADER_TEXT,
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
	showInfoButton: boolean;
}

export default class RoomListHeader extends ComponentBase<RoomListHeaderProps, RoomListHeaderState> {
	private language: Languages = 'en';
	private containerView: RX.View | undefined;

	constructor(props: RoomListHeaderProps) {
		super(props);

		this.language = UiStore.getLanguage();
	}

	protected _buildState(
		_nextProps: RoomListHeaderProps,
		initState: boolean,
		_prevState: RoomListHeaderState
	): Partial<RoomListHeaderState> {
		const partialState: Partial<RoomListHeaderState> = {};

		if (initState) {
			partialState.showInfoButton = false;
		}

		if (UiStore.getUnknownAccessToken()) {
			this.logout().catch(_error => null);
		}

		partialState.offline = UiStore.getOffline();

		return partialState;
	}

	public componentDidMount() {
		super.componentDidMount();

		if (!this.state.offline && ['android', 'ios'].includes(UiStore.getPlatform() || UiStore.getIsElectron())) {
			StoreVersion.check()
				.then(response => {
					if (response) {
						this.setState({ showInfoButton: true });
					}
				})
				.catch(_error => null);
		}
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
		RX.UserInterface.measureLayoutRelativeToWindow(this.containerView!)
			.then(layout => {
				const dialogMenuMain = (
					<DialogMenuMain
						layout={layout}
						onPressNewChat={this.onPressNewChat}
						onPressSettings={this.onPressSettings}
						onPressAbout={this.onPressAbout}
						onPressLogout={this.onPressLogout}
					/>
				);

				RX.Modal.show(dialogMenuMain, 'dialog_menu_main');
			})
			.catch(_error => null);
	};

	public render(): JSX.Element | null {
		let disconnected: ReactElement | undefined;
		if (this.state.offline) {
			disconnected = (
				<RX.View style={styles.iconContainer}>
					<IconSvg
						source={require('../resources/svg/RI_nochat.json') as SvgFile}
						fillColor={TILE_SYSTEM_TEXT}
						height={14}
						width={14}
					/>
				</RX.View>
			);
		}

		let infoButton: ReactElement | undefined;
		if (!this.state.offline && this.state.showInfoButton) {
			infoButton = (
				<AnimatedButton
					buttonStyle={styles.infoButton}
					iconSource={require('../resources/svg/RI_info.json') as SvgFile}
					iconFillColor={TILE_SYSTEM_TEXT}
					iconHeight={BUTTON_HEADER_WIDTH}
					iconWidth={BUTTON_HEADER_WIDTH}
					animatedColor={TILE_SYSTEM_TEXT}
					onPress={StoreVersion.showDialog}
				/>
			);
		}

		const width =
			UiStore.getAppLayout_().pageWidth -
			2 * PAGE_MARGIN -
			1 * (HEADER_HEIGHT / 2 + SPACING) -
			2 * 4 -
			2 * SPACING;

		return (
			<RX.View
				style={styles.container}
				ref={component => (this.containerView = component!)}
				onLayout={() => null}
			>
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
				<RX.View style={styles.buttonContainer}>
					<AnimatedButton
						buttonStyle={styles.roundButton}
						iconSource={require('../resources/svg/RI_menu.json') as SvgFile}
						iconFillColor={BUTTON_FILL_HEADER}
						iconHeight={22}
						iconWidth={22}
						animatedColor={BUTTON_FILL_HEADER}
						onPress={this.showMenu}
					/>
					{disconnected}
					{infoButton}
				</RX.View>
			</RX.View>
		);
	}
}
