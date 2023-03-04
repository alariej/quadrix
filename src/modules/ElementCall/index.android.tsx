import React from 'react';
import RX from 'reactxp';
import {
	BORDER_RADIUS,
	BUTTON_FILL,
	BUTTON_VIDEOCALL_BACKGROUND,
	BUTTON_ROUND_WIDTH,
	VIDEOCALL_BORDER,
	OPAQUE_BACKGROUND,
	PAGE_MARGIN,
	SPACING,
	TRANSPARENT_BACKGROUND,
	HEADER_HEIGHT,
} from '../../ui';
import ApiClient from '../../matrix/ApiClient';
import StringUtils from '../../utils/StringUtils';
import DataStore from '../../stores/DataStore';
import { GroupCallIntent, GroupCallType, CallEventContent_, CallMemberEventContent_ } from '../../models/MatrixApi';
import UiStore from '../../stores/UiStore';
import { APP_WEBSITE_URL, ELEMENT_CALL_URL } from '../../appconfig';
import { ComponentBase } from 'resub';
import { Msc3401Call } from '../../models/Msc3401Call';
import IconSvg, { SvgFile } from '../../components/IconSvg';
import WebView from 'react-native-webview';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';

const styles = {
	container: RX.Styles.createViewStyle({
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: OPAQUE_BACKGROUND,
	}),
	containerMinimized: RX.Styles.createViewStyle({
		position: 'absolute',
		bottom: PAGE_MARGIN + SPACING,
		right: PAGE_MARGIN + SPACING,
		width: 80,
		height: 100,
		backgroundColor: TRANSPARENT_BACKGROUND,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: BORDER_RADIUS,
		borderWidth: 1,
		borderColor: VIDEOCALL_BORDER,
		overflow: 'hidden',
	}),
	callContainer: RX.Styles.createViewStyle({
		flex: 1,
		margin: PAGE_MARGIN,
		marginTop: HEADER_HEIGHT / 2,
		backgroundColor: TRANSPARENT_BACKGROUND,
	}),
	callContainerMinimized: RX.Styles.createViewStyle({
		width: 80,
		height: 100,
	}),
	buttonMinimize: RX.Styles.createViewStyle({
		position: 'absolute',
		left: 3 * SPACING,
		top: 2 * SPACING,
		width: BUTTON_ROUND_WIDTH,
		height: BUTTON_ROUND_WIDTH,
	}),
	buttonMaximize: RX.Styles.createViewStyle({
		position: 'absolute',
		width: 80,
		height: 100,
		backgroundColor: BUTTON_VIDEOCALL_BACKGROUND,
	}),
	containerIcon: RX.Styles.createViewStyle({
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	}),
};

enum CallEvents {
	GroupCallPrefix = 'org.matrix.msc3401.call',
	GroupCallMemberPrefix = 'org.matrix.msc3401.call.member',
}

interface IRoomEvent {
	type: string;
	sender: string;
	event_id: string;
	room_id: string;
	state_key?: string;
	origin_server_ts: number;
	content: unknown;
	unsigned: unknown;
}

interface ElementCallMessageEvent {
	type: string;
	eventType?: string;
	content?: CallMemberEventContent_;
	contentMap?: { [userId: string]: { [deviceId: string]: object } };
	stateKey?: string;
	roomId?: string;
}

interface ElementCallProps {
	roomId: string;
	closeVideoCall: () => void;
}

interface ElementCallState {
	isMinimized: boolean;
}

export default class ElementCall extends ComponentBase<ElementCallProps, ElementCallState> {
	private newMessageSubscription: number;
	private newCallEventSubscription: number;
	private callId = '';
	private elementCallUrl = ELEMENT_CALL_URL;
	private baseUrl = 'https://' + ApiClient.credentials.homeServer;
	private widgetId = 'quadrixelementcallwidget';
	private webviewHtml = '';
	private webView!: WebView | null;

	constructor(props: ElementCallProps) {
		super(props);

		this.newMessageSubscription = DataStore.subscribe(this.newMessages, DataStore.MessageTrigger);
		this.newCallEventSubscription = DataStore.subscribe(this.newCallEvents, DataStore.CallEventTrigger);

		const roomSummary = DataStore.getRoomSummary(this.props.roomId);

		const stateEventsMember: IRoomEvent[] = [];
		Object.values(roomSummary.members).map(member => {
			if (member.membership === 'join') {
				const memberEvent: IRoomEvent = {
					event_id: StringUtils.getRandomString(8),
					origin_server_ts: Date.now(),
					room_id: this.props.roomId,
					sender: member.id,
					state_key: member.id,
					type: 'm.room.member',
					content: {
						displayname: member.id,
						membership: 'join',
					},
					unsigned: {},
				};
				stateEventsMember.push(memberEvent);
			}
		});
		const memberPayload = JSON.stringify(stateEventsMember);

		const msc3401Call = roomSummary.msc3401Call;

		if (!msc3401Call || !this.isActiveCall(msc3401Call)) {
			this.callId = StringUtils.getRandomString(8);

			const content: CallEventContent_ = {
				'm.intent': GroupCallIntent.Prompt,
				'm.type': GroupCallType.Video,
				'io.element.ptt': false,
			};

			ApiClient.sendStateEvent(this.props.roomId, CallEvents.GroupCallPrefix, content, this.callId).catch(
				_error => null
			);
		} else {
			this.callId = msc3401Call.callId;
		}

		const content: CallEventContent_ = {
			'm.intent': GroupCallIntent.Prompt,
			'm.type': GroupCallType.Video,
			'io.element.ptt': false,
		};

		const stateEventCall: IRoomEvent = {
			type: CallEvents.GroupCallPrefix,
			sender: ApiClient.credentials.userIdFull,
			event_id: StringUtils.getRandomString(8),
			room_id: this.props.roomId,
			state_key: this.callId,
			origin_server_ts: Date.now(),
			content: content,
			unsigned: {},
		};
		const callPayload = JSON.stringify([stateEventCall]);

		const timelineEvents = roomSummary.timelineEvents.slice(0).reverse();
		const stateEventsCallMember = timelineEvents.filter(event => {
			const content = event.content as CallMemberEventContent_;
			return (
				event.type === CallEvents.GroupCallMemberPrefix &&
				content['m.calls'][0] &&
				content['m.calls'][0]['m.call_id'] === this.callId
			);
		}) as IRoomEvent[];
		for (let i = 0; i < stateEventsCallMember.length; i++) {
			stateEventsCallMember[i].room_id = this.props.roomId;
		}
		const callMemberPayload = JSON.stringify(stateEventsCallMember);

		this.webviewHtml = `
			<!DOCTYPE html>
			<html style="background-color: transparent; height: 100%; width: 100%; margin: 0px; padding: 0px">
				<head>
					<meta charset="utf-8" />
					<meta
						http-equiv="content-type"
						content="text/html;charset=utf-8"
					/>
                    <meta
						name="viewport"
						content="initial-scale=1.0;maximum-scale=1.0"
					>
				</head>
				<body style="background-color: transparent; height: 100%; display: flex; justify-content: center; align-items: center; width: 100%; margin: 0px; padding: 0px">
					<script type="text/javascript" src="https://unpkg.com/matrix-widget-api@1.1.1/dist/api.js"></script>
					<script type="text/javascript">
						var widgetApi;

						const roomId = "${this.props.roomId}";
						const callId = "${this.callId}";
						const userId = "${ApiClient.credentials.userIdFull}";
						const deviceId = "${ApiClient.credentials.deviceId}";
						const widgetId = "${this.widgetId}";
						const language = "${UiStore.getLanguage()}";
						const baseUrl = "${this.baseUrl}";
						const elementCallUrl = "${this.elementCallUrl}";
			
						const params = new URLSearchParams({
							embed: "true",
							preload: "true",
							hideHeader: "true",
							hideScreensharing: "true",
							userId: userId,
							deviceId: deviceId,
							roomId: roomId,
							baseUrl: baseUrl,
							enableE2e: "false",
							lang: language,
						});
			
						const url = new URL(elementCallUrl);
						url.pathname = "/room";
						url.hash = "#?" + params.toString();
						const widgetUrl = url.toString();
			
						const parsedUrl = new URL(widgetUrl);
						parsedUrl.searchParams.set("widgetId", widgetId);
						parsedUrl.searchParams.set("parentUrl", window.location.href.split("#", 2)[0]);
						const iFrameSrc = parsedUrl.toString().replace(/%24/g, "$");
			
						class CallWidgetDriver {
							validateCapabilities(requested) {
								return Promise.resolve(requested);
							}
			
							sendEvent(eventType, content, stateKey, roomId) {
								const payload = {
									type: "sendEvent",
									eventType: eventType,
									content: content,
									stateKey: stateKey,
									roomId: roomId,
								};
								window.ReactNativeWebView.postMessage(JSON.stringify(payload));
								const eventId = "event" + Math.round(Math.random() * 1000000);
								return Promise.resolve({ eventId: eventId, roomId: roomId });
							}
			
							sendToDevice(eventType, encrypted, contentMap) {
								const payload = {
									type: "sendToDevice",
									eventType: eventType,
									encrypted: encrypted,
									contentMap: contentMap,
								};
								window.ReactNativeWebView.postMessage(JSON.stringify(payload));
								return Promise.resolve();
							}
			
							readStateEvents(eventType, stateKey, limit, roomIds) {
								var stateEvents;
								var payload;
								if (eventType === "m.room.member") {
									payload = '${memberPayload}';
									stateEvents = JSON.parse(payload);
								} else if (eventType === "org.matrix.msc3401.call") {
									payload = '${callPayload}';
									stateEvents = JSON.parse(payload);
								} else if (eventType === "org.matrix.msc3401.call.member") {
									payload = '${callMemberPayload}';
									stateEvents = JSON.parse(payload);
								}
								return Promise.resolve(stateEvents);
							}
			
							async *getTurnServers() {
								const turnServer = {
									uris: ["stun:turn.matrix.org"],
									username: "",
									password: "",
								};
								yield await Promise.resolve(turnServer);
							}
						}
			
						const onTileLayout = ev => {
							ev.preventDefault();
							widgetApi.transport.reply(ev.detail, {});
						};
			
						const onAlwaysOnScreen = ev => {
							ev.preventDefault();
							widgetApi.transport.reply(ev.detail, {});
						};
			
						const onHangup = ev => {
							ev.preventDefault();
							widgetApi.transport.reply(ev.detail, {});
			
							widgetApi.off("action:im.vector.hangup", onHangup);
							widgetApi.off("action:io.element.tile_layout", onTileLayout);
							widgetApi.off("action:set_always_on_screen", onAlwaysOnScreen);
							widgetApi.removeAllListeners();
							widgetApi.stop();
			
							const payload = {
								type: "onHangup",
							};
							window.ReactNativeWebView.postMessage(JSON.stringify(payload));
							document.removeEventListener("message", handleWebviewRequest);
						};
			
						const onReady = async () => {
							await widgetApi.transport.send("io.element.join", {
								audioInput: "Default",
								videoInput: "Default",
							});
							widgetApi.on("action:im.vector.hangup", onHangup);
							widgetApi.on("action:io.element.tile_layout", onTileLayout);
							widgetApi.on("action:set_always_on_screen", onAlwaysOnScreen);
						};

						const handleWebviewRequest = (ev) => {
							const event_ = JSON.parse(ev.data);
							if (event_.type === "org.matrix.msc3401.call.member") {
								widgetApi.feedEvent(event_, event_.room_id);
							} else {
								widgetApi.feedToDevice(event_, false);
							}
						}

						const onIframeLoad = () => {
							const callWidget = {
								id: "quadrixelementcallwidget",
								creatorUserId: userId,
								type: "m.custom",
								url: widgetUrl,
								roomId: roomId,
							};
			
							const widget = new mxwidgets.Widget(callWidget);
			
							const callWidgetIframe = document.getElementById("call-widget-iframe");
							callWidgetIframe.src = iFrameSrc;
							callWidgetIframe.onload = "";
			
							const widgetDriver = new CallWidgetDriver();
							widgetApi = new mxwidgets.ClientWidgetApi(widget, callWidgetIframe, widgetDriver);
			
							widgetApi.once("ready", onReady);

							document.addEventListener("message", handleWebviewRequest);
						};
					</script>
			
					<iframe
						id="call-widget-iframe"
						style="height: 100%; width: 100%; border-width: 0px; border-radius: 0px;"
						allow="camera;microphone"
						onload="onIframeLoad()"
					>
					</iframe>
				</body>
			</html>
		`;
	}

	public componentDidMount(): void {
		super.componentDidMount();
		RX.Modal.dismiss('dialog_menu_composer');
	}

	public componentWillUnmount(): void {
		super.componentWillUnmount();

		DataStore.unsubscribe(this.newMessageSubscription);
		DataStore.unsubscribe(this.newCallEventSubscription);
	}

	private newMessages = () => {
		const newRoomEvents = DataStore.getNewRoomEvents(this.props.roomId);

		if (newRoomEvents.length === 0) {
			return;
		}

		if (newRoomEvents[0].type === CallEvents.GroupCallMemberPrefix) {
			const event_: IRoomEvent = {
				room_id: this.props.roomId,
				event_id: newRoomEvents[0].eventId,
				content: newRoomEvents[0].content,
				type: newRoomEvents[0].type,
				origin_server_ts: newRoomEvents[0].time,
				sender: newRoomEvents[0].senderId,
				state_key: newRoomEvents[0].senderId,
				unsigned: {},
			};

			this.webView?.postMessage(JSON.stringify(event_));
		}
	};

	private newCallEvents = () => {
		const callEvents = DataStore.getCallEvents();

		callEvents.map(event => {
			if (event.content.conf_id === this.callId) {
				this.webView?.postMessage(JSON.stringify(event));
			}
		});
	};

	private isActiveCall = (msc3401Call: Msc3401Call): boolean => {
		if (msc3401Call.callEventContent?.['m.terminated'] || !msc3401Call.participants) {
			return false;
		}

		const activeParticipants = Object.entries(msc3401Call.participants).filter(
			participant => participant[1] === true
		);

		return activeParticipants.length > 0;
	};

	private TerminateCall = () => {
		const roomSummary = DataStore.getRoomSummary(this.props.roomId);
		const participants = roomSummary.msc3401Call?.participants;

		if (roomSummary.msc3401Call && participants) {
			const remainingParticipant = Object.entries(participants).find(
				participant => participant[1] === true && participant[0] !== ApiClient.credentials.userIdFull
			);
			if (!remainingParticipant) {
				const content: CallEventContent_ = {
					'm.intent': GroupCallIntent.Room,
					'm.type': GroupCallType.Video,
					'io.element.ptt': false,
					'm.terminated': 'call_ended',
				};

				ApiClient.sendStateEvent(
					this.props.roomId,
					CallEvents.GroupCallPrefix,
					content,
					roomSummary.msc3401Call.callId
				).catch(_error => null);
			}
		}
	};

	private setMinimized = (isMinimized: boolean) => {
		RX.UserInterface.dismissKeyboard();
		this.setState({ isMinimized: isMinimized });
	};

	private onMessage = (message: WebViewMessageEvent) => {
		const message_ = JSON.parse(message.nativeEvent.data) as ElementCallMessageEvent;

		if (message_.type === 'onHangup') {
			this.TerminateCall();
			this.props.closeVideoCall();
		} else if (
			message_.type === 'sendEvent' &&
			message_.eventType === CallEvents.GroupCallMemberPrefix &&
			message_.content
		) {
			ApiClient.sendStateEvent(this.props.roomId, message_.eventType, message_.content, message_.stateKey).catch(
				_error => null
			);
		} else if (message_.type === 'sendToDevice' && message_.eventType) {
			const transactionId = StringUtils.getRandomString(8);
			ApiClient.sendToDevice(message_.eventType, transactionId, message_.contentMap).catch(_error => null);
		}
	};

	public render(): JSX.Element | null {
		const url = APP_WEBSITE_URL;

		let buttonMinimize;
		let buttonMaximize;

		if (this.state.isMinimized) {
			buttonMinimize = null;

			buttonMaximize = (
				<RX.Button
					style={styles.buttonMaximize}
					onPress={() => this.setMinimized(false)}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				></RX.Button>
			);
		} else {
			buttonMaximize = null;

			buttonMinimize = (
				<RX.Button
					style={styles.buttonMinimize}
					onPress={() => this.setMinimized(true)}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					<RX.View style={styles.containerIcon}>
						<IconSvg
							source={require('../../resources/svg/RI_arrowdown.json') as SvgFile}
							fillColor={BUTTON_FILL}
							height={BUTTON_ROUND_WIDTH}
							width={BUTTON_ROUND_WIDTH}
						/>
					</RX.View>
				</RX.Button>
			);
		}

		return (
			<RX.View style={this.state.isMinimized ? styles.containerMinimized : styles.container}>
				<RX.View style={this.state.isMinimized ? styles.callContainerMinimized : styles.callContainer}>
					<WebView
						ref={ref => {
							this.webView = ref;
						}}
						style={{
							backgroundColor: TRANSPARENT_BACKGROUND,
						}}
						scrollEnabled={false}
						originWhitelist={['*']}
						source={{
							html: this.webviewHtml,
							baseUrl: `${url}`,
						}}
						onMessage={this.onMessage}
						mediaPlaybackRequiresUserAction={false}
						allowsInlineMediaPlayback={true}
						javaScriptEnabled={true}
					/>
					{buttonMinimize}
				</RX.View>
				{buttonMaximize}
			</RX.View>
		);
	}
}
