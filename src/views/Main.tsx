import React, { ReactElement } from 'react';
import RX, { Types } from 'reactxp';
import RoomList from './RoomList';
import Room from './Room';
import {
	PAGE_MARGIN,
	MODAL_CONTENT_TEXT,
	FONT_LARGE,
	PAGE_WIDE_PADDING,
	TRANSPARENT_BACKGROUND,
	HEADER_HEIGHT,
	CONTENT_BACKGROUND,
	BUTTON_FILL,
	APP_BACKGROUND,
} from '../ui';
import DataStore from '../stores/DataStore';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import ShareHandlerIncoming from '../modules/ShareHandlerIncoming';
import UiStore, { Layout } from '../stores/UiStore';
import { clearDatastore, deviceOffline } from '../translations';
import { ComponentBase } from 'resub';
import Pushers from '../modules/Pushers';
import SpinnerUtils from '../utils/SpinnerUtils';
import AppFont from '../modules/AppFont';
import IconSvg, { SvgFile } from '../components/IconSvg';
import { APP_VERSION, CLEAR_DATASTORE_VERSION, WIDGETS_URL } from '../appconfig';
import { FilteredChatEvent } from '../models/FilteredChatEvent';
import ElementCall from '../modules/ElementCall';
import semver from 'semver';
import axios from 'axios';

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
		backgroundColor: CONTENT_BACKGROUND,
		borderTopWidth: HEADER_HEIGHT,
		borderColor: APP_BACKGROUND,
	}),
	paddingRight: RX.Styles.createViewStyle({
		width: PAGE_WIDE_PADDING,
		backgroundColor: CONTENT_BACKGROUND,
		borderTopWidth: HEADER_HEIGHT,
		borderColor: APP_BACKGROUND,
	}),
	background: RX.Styles.createViewStyle({
		position: 'absolute',
		top: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'visible',
		backgroundColor: CONTENT_BACKGROUND,
		borderTopWidth: HEADER_HEIGHT,
		borderColor: APP_BACKGROUND,
	}),
};

interface MainProps {
	showLogin: () => void;
	sharedContent: string;
}

interface MainState {
	showRoom: boolean;
	showVideoCall: boolean;
	layout: Layout;
}

const animatedRoomDurationIn = 200;
const animatedRoomDurationOut = 850;
const animatedContainerDuration = 250;
const matrixSize = 84;

export default class Main extends ComponentBase<MainProps, MainState> {
	private message!: FilteredChatEvent;
	private tempId = '';
	private videoCallRoomId = '';
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

		this.animatedRoomOpacityValue = RX.Animated.createValue(0);
		this.animatedRoomStyle = RX.Styles.createAnimatedViewStyle({
			opacity: this.animatedRoomOpacityValue,
		});

		this.animatedRoomIn = RX.Animated.timing(this.animatedRoomOpacityValue, {
			duration: animatedRoomDurationIn,
			toValue: 0,
			easing: RX.Animated.Easing.InOut(),
			useNativeDriver: true,
		});

		this.animatedRoomOut = RX.Animated.timing(this.animatedRoomOpacityValue, {
			duration: animatedRoomDurationOut,
			toValue: 1,
			easing: RX.Animated.Easing.InOut(),
			useNativeDriver: true,
		});

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

		if (!this.isOffline) {
			axios
				.request({
					url: WIDGETS_URL,
					method: 'GET',
				})
				.then(response => {
					interface WidgetsData {
						elementcall: { url: string };
					}
					const widgetsData = response?.data as WidgetsData;
					if (widgetsData) {
						UiStore.setElementCallUrl(widgetsData.elementcall.url);
					}
				})
				.catch(_error => null);
		}

		const storedAppVersion = await ApiClient.getStoredAppVersion().catch(_error => null);

		if (
			storedAppVersion &&
			semver.gt(APP_VERSION, storedAppVersion) &&
			semver.lte(storedAppVersion, CLEAR_DATASTORE_VERSION)
		) {
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
		RX.StatusBar.setBackgroundColor(BUTTON_FILL, true);
		RX.StatusBar.setBarStyle('dark-content', true);

		this.showRoomList();
		ShareHandlerIncoming.shareContent(event.url, this.showTempForwardedMessage);
	};

	private onBackButton = () => {
		RX.Modal.dismissAll();
		this.showRoomList();
		return true;
	};

	private showTempForwardedMessage = (roomId: string, message: FilteredChatEvent, tempId: string) => {
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
				showVideoCall={this.showVideoCall}
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
				showVideoCall={this.showVideoCall}
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

	private showVideoCall = (roomId: string) => {
		this.videoCallRoomId = roomId;
		this.setState({ showVideoCall: true });
	};

	private closeVideoCall = () => {
		this.setState({ showVideoCall: false }, () => {
			setTimeout(() => {
				RX.StatusBar.setBackgroundColor(BUTTON_FILL, true);
				RX.StatusBar.setBarStyle('dark-content', true);
			}, 2000);
		});
	};

	public render(): JSX.Element | null {
		if (!this.state.layout) {
			return null;
		}

		const backgroundPadding = this.state.layout.type === 'wide' ? PAGE_WIDE_PADDING * 2 : 0;
		const offset = this.state.layout.pageWidth - PAGE_MARGIN;

		const backgroundImage = (
			<RX.View
				style={[
					styles.background,
					{
						left: offset,
						width: this.state.layout.pageWidth + backgroundPadding,
					},
				]}
			>
				<IconSvg
					source={require('../resources/svg/matrix.json') as SvgFile}
					height={matrixSize}
					width={matrixSize}
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

		let videoCall: ReactElement | undefined;
		if (this.state.showVideoCall) {
			videoCall = (
				<ElementCall
					roomId={this.videoCallRoomId}
					closeVideoCall={this.closeVideoCall}
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
					<RX.Animated.View
						ignorePointerEvents={true}
						style={[styles.containerAnimatedRoom, this.animatedRoomStyle]}
					>
						{paddingLeft}
						{paddingRight}
						{roomPage}
					</RX.Animated.View>
				</RX.Animated.View>
				{videoCall}
			</RX.View>
		);
	}
}
