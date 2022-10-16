import React, { ReactElement } from 'react';
import RX, { Types } from 'reactxp';
import RoomList from './RoomList';
import Room from './Room';
import {
	PAGE_MARGIN,
	MODAL_CONTENT_TEXT,
	FONT_LARGE,
	COMPOSER_BORDER,
	PAGE_WIDE_PADDING,
	TRANSPARENT_BACKGROUND,
	HEADER_HEIGHT,
	STATUSBAR_BACKGROUND,
} from '../ui';
import DataStore from '../stores/DataStore';
import { MessageEvent } from '../models/MessageEvent';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import ShareHandlerIncoming from '../modules/ShareHandlerIncoming';
import UiStore, { Layout } from '../stores/UiStore';
import { clearDatastore, deviceOffline } from '../translations';
import JitsiMeet from '../modules/JitsiMeet';
import { ComponentBase } from 'resub';
import Pushers from '../modules/Pushers';
import SpinnerUtils from '../utils/SpinnerUtils';
import AppFont from '../modules/AppFont';
import IconSvg, { SvgFile } from '../components/IconSvg';
import { APP_VERSION, CLEAR_DATASTORE } from '../appconfig';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		flexDirection: 'row',
		padding: PAGE_MARGIN,
	}),
	containerAnimatedRoom: RX.Styles.createViewStyle({
		flex: 1,
		flexDirection: 'row',
	}),
	containerRoomList: RX.Styles.createViewStyle({
		marginRight: PAGE_MARGIN,
		overflow: 'visible',
	}),
	containerRoom: RX.Styles.createViewStyle({
		marginLeft: PAGE_MARGIN,
	}),
	textDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
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
	background: RX.Styles.createViewStyle({
		position: 'absolute',
		top: HEADER_HEIGHT,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
	}),
};

interface MainProps {
	showLogin: () => void;
	sharedContent: string;
}

interface MainState {
	showRoom: boolean;
	showJitsiMeet: boolean;
	layout: Layout;
}

const animatedRoomTranslateX = -2 * PAGE_WIDE_PADDING;
const animatedRoomDurationIn = 150;
const animatedRoomDurationOut = 300;
const animatedContainerDuration = animatedRoomDurationIn + animatedRoomDurationOut + 100;

export default class Main extends ComponentBase<MainProps, MainState> {
	private message!: MessageEvent;
	private tempId = '';
	private jitsiMeetId = '';
	private animatedRoomTranslateXValue: RX.Animated.Value;
	private animatedRoomOpacityValue: RX.Animated.Value;
	private animatedRoomStyle: RX.Types.AnimatedViewStyleRuleSet;
	private animatedRoomIn: RX.Types.Animated.CompositeAnimation;
	private animatedRoomOut: RX.Types.Animated.CompositeAnimation;
	private animatedContainerTranslateXValue: RX.Animated.Value;
	private animatedContainerTranslateX = 0;
	private animatedContainerStyle: RX.Types.AnimatedViewStyleRuleSet;
	private roomList: ReactElement | undefined;
	private room: ReactElement | undefined;
	private appLayoutSubscription: number;
	private appOfflineSubscription: number;
	private isOffline: boolean;

	constructor(props: MainProps) {
		super(props);

		this.appLayoutSubscription = UiStore.subscribe(this.changeAppLayout, UiStore.LayoutTrigger);
		this.appOfflineSubscription = UiStore.subscribe(this.changeAppOffline, UiStore.OfflineTrigger);

		this.isOffline = UiStore.getOffline();

		this.roomList = (
			<RoomList
				showRoom={this.showRoom}
				showLogin={this.props.showLogin}
			/>
		);

		this.animatedRoomTranslateXValue = RX.Animated.createValue(animatedRoomTranslateX);
		this.animatedRoomOpacityValue = RX.Animated.createValue(0);
		this.animatedRoomStyle = RX.Styles.createAnimatedViewStyle({
			opacity: this.animatedRoomOpacityValue,
			transform: [{ translateX: this.animatedRoomTranslateXValue }],
		});

		this.animatedRoomIn = RX.Animated.parallel([
			RX.Animated.timing(this.animatedRoomOpacityValue, {
				duration: animatedRoomDurationIn,
				toValue: 0,
				easing: RX.Animated.Easing.InOut(),
				useNativeDriver: true,
			}),
			RX.Animated.timing(this.animatedRoomTranslateXValue, {
				duration: animatedRoomDurationIn,
				toValue: animatedRoomTranslateX,
				easing: RX.Animated.Easing.InOut(),
				useNativeDriver: true,
			}),
		]);

		this.animatedRoomOut = RX.Animated.parallel([
			RX.Animated.timing(this.animatedRoomOpacityValue, {
				duration: animatedRoomDurationOut,
				toValue: 1,
				easing: RX.Animated.Easing.InOut(),
				useNativeDriver: true,
			}),
			RX.Animated.timing(this.animatedRoomTranslateXValue, {
				duration: animatedRoomDurationOut,
				toValue: 0,
				easing: RX.Animated.Easing.InOut(),
				useNativeDriver: true,
			}),
		]);

		this.animatedContainerTranslateXValue = RX.Animated.createValue(0);
		this.animatedContainerStyle = RX.Styles.createAnimatedViewStyle({
			transform: [{ translateX: this.animatedContainerTranslateXValue }],
		});
	}

	private changeAppLayout = () => {
		if (RX.App.getActivationState() === Types.AppActivationState.Active) {
			this.setState({ layout: UiStore.getAppLayout() }, () => {
				this.animatedContainerTranslateX = -this.state.layout.pageWidth;
			});
		}
	};

	public async componentDidMount(): Promise<void> {
		super.componentDidMount();

		UiStore.setUnknownAccessToken(false);

		Pushers.set(ApiClient.credentials).catch(_error => null);

		if (CLEAR_DATASTORE) {
			const storedAppVersion = await ApiClient.getStoredAppVersion().catch(_error => null);

			if (storedAppVersion && storedAppVersion !== APP_VERSION) {
				await ApiClient.clearDataStore();
				await ApiClient.storeAppVersion();
				ApiClient.clearNextSyncToken();
				DataStore.clearRoomSummaryList();

				const text = (
					<RX.Text style={styles.textDialog}>
						<RX.Text>{clearDatastore[UiStore.getLanguage()]}</RX.Text>
					</RX.Text>
				);

				const onCancel = () => {
					RX.Modal.dismiss('modal_cleardatastore');
					if (!DataStore.getSyncComplete()) {
						SpinnerUtils.showModalSpinner('syncspinner');
					}
				};

				const dialog = (
					<DialogContainer
						content={text}
						onCancel={onCancel}
					/>
				);

				RX.Modal.show(dialog, 'modal_cleardatastore');
			}
		}

		if (!this.isOffline) {
			DataStore.setSyncComplete(false);

			const storedSyncToken = await ApiClient.getStoredSyncToken()!;

			if (storedSyncToken) {
				ApiClient.setNextSyncToken(storedSyncToken);

				await ApiClient.restoreDataStore()
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
			await ApiClient.getStoredSyncToken()
				.then(token => {
					ApiClient.setNextSyncToken(token!);
				})
				.catch(_error => null);

			await ApiClient.restoreDataStore()
				.then(_response => {
					ApiClient.stopSync();
					DataStore.setSyncComplete(true);
					this.showRoomList();
				})
				.catch(_error => {
					const text = <RX.Text style={styles.textDialog}>{deviceOffline[UiStore.getLanguage()]}</RX.Text>;

					const dialog = (
						<DialogContainer
							content={text}
							confirmButton={true}
							confirmButtonText={'OK'}
							onConfirm={() => {
								RX.Modal.dismissAll();
								this.showRoomList();
							}}
						/>
					);

					RX.Modal.show(dialog, 'modaldialog_nodata');
				});
		}

		RX.App.activationStateChangedEvent.subscribe(this.activationChanged);

		RX.Input.backButtonEvent.subscribe(this.onBackButton);

		ShareHandlerIncoming.addListener(this.shareContent);

		if (!this.state.layout) {
			this.setState({ layout: UiStore.getAppLayout_() }, () => {
				this.animatedContainerTranslateX = -this.state.layout?.pageWidth;
			});
		}
	}

	public componentWillUnmount(): void {
		super.componentWillUnmount();

		RX.Input.backButtonEvent.unsubscribe(this.onBackButton);

		RX.App.activationStateChangedEvent.unsubscribe(this.activationChanged);

		ShareHandlerIncoming.removeListener();

		UiStore.unsubscribe(this.appLayoutSubscription);
		UiStore.unsubscribe(this.appOfflineSubscription);
	}

	private activationChanged = (activationState: Types.AppActivationState) => {
		if (activationState !== Types.AppActivationState.Active) {
			ApiClient.stopSync();
			ApiClient.storeAppData().catch(_error => null);
		} else {
			if (ApiClient.isSyncStopped() && !this.isOffline) {
				DataStore.setSyncComplete(false);

				if (!RX.Modal.isDisplayed()) {
					SpinnerUtils.showModalSpinner('syncspinner', TRANSPARENT_BACKGROUND);
				}

				const nextSyncToken = ApiClient.getNextSyncToken();
				ApiClient.startSync(nextSyncToken);
			}
		}
	};

	private changeAppOffline = () => {
		this.isOffline = UiStore.getOffline();

		if (this.isOffline) {
			ApiClient.stopSync();
			ApiClient.storeAppData().catch(_error => null);
		} else {
			if (ApiClient.isSyncStopped()) {
				DataStore.setSyncComplete(false);

				if (!RX.Modal.isDisplayed()) {
					SpinnerUtils.showModalSpinner('syncspinner', TRANSPARENT_BACKGROUND);
				}

				const nextSyncToken = ApiClient.getNextSyncToken();
				ApiClient.startSync(nextSyncToken);
			}
		}
	};

	private shareContent = (event: { url: string }) => {
		RX.StatusBar.setBackgroundColor(STATUSBAR_BACKGROUND, true);
		RX.StatusBar.setBarStyle('dark-content', true);

		this.showRoomList();
		ShareHandlerIncoming.shareContent(event.url, this.showTempForwardedMessage);
	};

	private onBackButton = () => {
		RX.Modal.dismissAll();
		this.showRoomList();
		return true;
	};

	private showTempForwardedMessage = (roomId: string, message: MessageEvent, tempId: string) => {
		SpinnerUtils.dismissModalSpinner('forwardmessagespinner');

		this.message = message;
		this.tempId = tempId;

		this.room = (
			<Room
				roomId={roomId}
				showLogin={this.props.showLogin}
				showRoomList={this.showRoomList}
				showTempForwardedMessage={this.showTempForwardedMessage}
				tempForwardedMessage={{ message: this.message, tempId: this.tempId }}
				showJitsiMeet={this.showJitsiMeet}
				showRoom={this.showRoom}
			/>
		);

		if (this.state.showRoom) {
			this.animatedRoomIn.start(() => {
				this.animatedRoomOut.start();
				this.setState({ showRoom: true });
			});
		} else {
			this.animatedRoomOut.start();
			this.setState({ showRoom: true });
		}

		if (this.state.layout.type === 'narrow') {
			RX.Animated.timing(this.animatedContainerTranslateXValue, {
				duration: animatedContainerDuration,
				toValue: this.animatedContainerTranslateX,
				easing: RX.Animated.Easing.InOut(),
				useNativeDriver: true,
			}).start();
		}

		UiStore.setSelectedRoom(roomId);
	};

	private showRoom = (roomId: string) => {
		this.room = (
			<Room
				roomId={roomId}
				showLogin={this.props.showLogin}
				showRoomList={this.showRoomList}
				showTempForwardedMessage={this.showTempForwardedMessage}
				showJitsiMeet={this.showJitsiMeet}
				showRoom={this.showRoom}
			/>
		);

		if (this.state.showRoom) {
			this.animatedRoomIn.start(() => {
				this.animatedRoomOut.start();
				this.setState({ showRoom: true });
			});
		} else {
			this.animatedRoomOut.start();
			this.setState({ showRoom: true });
		}

		if (this.state.layout.type === 'narrow') {
			RX.Animated.timing(this.animatedContainerTranslateXValue, {
				duration: animatedContainerDuration,
				toValue: this.animatedContainerTranslateX,
				easing: RX.Animated.Easing.InOut(),
				useNativeDriver: true,
			}).start();
		}

		UiStore.setSelectedRoom(roomId);
	};

	private showRoomList = () => {
		if (this.state.showRoom) {
			this.animatedRoomIn.start(() => this.setState({ showRoom: false }));
		} else {
			this.setState({ showRoom: false });
		}

		if (this.state.layout?.type === 'narrow' && this.state.showRoom) {
			RX.Animated.timing(this.animatedContainerTranslateXValue, {
				duration: animatedContainerDuration,
				toValue: 0,
				easing: RX.Animated.Easing.InOut(),
				useNativeDriver: true,
			}).start();
		}

		this.room = undefined;
		UiStore.setSelectedRoom('');
	};

	private showJitsiMeet = (jitsiMeetId: string) => {
		this.jitsiMeetId = jitsiMeetId;
		UiStore.setJitsiActive(true);
		this.setState({ showJitsiMeet: true });
	};

	private closeJitsiMeet = () => {
		UiStore.setJitsiActive(false);
		this.setState({ showJitsiMeet: false }, () => {
			setTimeout(() => {
				RX.StatusBar.setBackgroundColor(STATUSBAR_BACKGROUND, true);
				RX.StatusBar.setBarStyle('dark-content', true);
			}, 2000);
		});
	};

	public render(): JSX.Element | null {
		if (!this.state.layout) {
			return null;
		}

		const backgroundSize = 180;
		const backgroundPadding = this.state.layout.type === 'wide' ? PAGE_WIDE_PADDING * 2 : 0;
		const offset = 1.5 * this.state.layout.pageWidth - PAGE_MARGIN + backgroundPadding;

		const backgroundImage = (
			<RX.View style={[styles.background, { left: offset - backgroundSize / 2 }]}>
				<IconSvg
					source={require('../resources/svg/matrix.json') as SvgFile}
					style={{ opacity: 0.4 }}
					height={backgroundSize}
					width={backgroundSize}
					fillColor={'white'}
				/>
			</RX.View>
		);

		const roomListPage = (
			<RX.View style={[styles.containerRoomList, { width: this.state.layout.pageWidth - PAGE_MARGIN * 2 }]}>
				{backgroundImage}
				{this.roomList}
			</RX.View>
		);

		let room: ReactElement | undefined;
		if (this.state.showRoom && this.room) {
			room = this.room;
		}

		const roomPage = (
			<RX.View
				ignorePointerEvents={true}
				style={[styles.containerRoom, { width: this.state.layout.pageWidth - PAGE_MARGIN * 2 }]}
			>
				{room}
			</RX.View>
		);

		let jitsiMeet: ReactElement | undefined;
		if (this.state.showJitsiMeet) {
			jitsiMeet = (
				<JitsiMeet
					jitsiMeetId={this.jitsiMeetId}
					closeJitsiMeet={this.closeJitsiMeet}
				/>
			);
		}

		let paddingLeft;
		let paddingRight;
		if (this.state.layout.type === 'wide') {
			paddingLeft = <RX.View style={styles.paddingLeft} />;
			paddingRight = <RX.View style={styles.paddingRight} />;
		}

		return (
			<RX.View style={{ flex: 1 }}>
				<RX.Animated.View
					style={[
						styles.container,
						this.animatedContainerStyle,
						{
							width: this.state.layout.containerWidth,
							alignSelf: this.state.layout.type === 'wide' ? 'center' : undefined,
						},
					]}
				>
					{roomListPage}
					{paddingLeft}
					{paddingRight}
					<RX.Animated.View
						ignorePointerEvents={true}
						style={[styles.containerAnimatedRoom, this.animatedRoomStyle]}
					>
						{roomPage}
					</RX.Animated.View>
				</RX.Animated.View>
				{jitsiMeet}
			</RX.View>
		);
	}
}
