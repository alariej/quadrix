import React from 'react';
import RX from 'reactxp';
import {
	BORDER_RADIUS,
	BUTTON_FILL,
	BUTTON_JITSI_BACKGROUND,
	BUTTON_ROUND_WIDTH,
	JITSI_BORDER,
	OPAQUE_BACKGROUND,
	PAGE_MARGIN,
	SPACING,
	TRANSPARENT_BACKGROUND,
} from '../../ui';
import ApiClient from '../../matrix/ApiClient';
import {
	WidgetDriver,
	ClientWidgetApi,
	Widget,
	IWidget,
	Capability,
	IWidgetApiRequest,
	IRoomEvent,
	IWidgetApiRequestData,
} from 'matrix-widget-api';
import StringUtils from '../../utils/StringUtils';
import DataStore from '../../stores/DataStore';
import {
	GroupCallIntent,
	GroupCallType,
	CallEventContent_,
	ClientEventType,
	StateEventType,
	CallMemberEventContent_,
} from '../../models/MatrixApi';
import UiStore from '../../stores/UiStore';
import { ELEMENT_CALL_URL } from '../../appconfig';
import { ComponentBase } from 'resub';
import { Msc3401Call } from '../../models/Msc3401Call';
import IconSvg, { SvgFile } from '../../components/IconSvg';
import WebView, { WebViewProps } from 'react-native-webview';
// import { EventRegister } from 'react-native-event-listeners';
import { EventEmitter } from 'events';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
// import { URL as URL_ } from 'whatwg-url';
// import { URL as URL_, URLSearchParams } from 'react-native-url-polyfill';

// see https://github.com/facebook/react-native/issues/14796
// import { Buffer } from 'buffer';
// global.Buffer = Buffer;

// see https://github.com/facebook/react-native/issues/16434
// import { URL as URL_, URLSearchParams as URLSearchParams_ } from 'whatwg-url';
// global.URL = URL_ as unknown as typeof global.URL;
// global.URLSearchParams = URLSearchParams_ as unknown as typeof global.URLSearchParams;

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		justifyContent: 'center',
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
		borderColor: JITSI_BORDER,
		overflow: 'hidden',
	}),
	callContainer: RX.Styles.createViewStyle({
		flex: 1,
		margin: 48,
	}),
	callContainerMinimized: RX.Styles.createViewStyle({
		width: 80,
		height: 100,
	}),
	buttonMinimize: RX.Styles.createViewStyle({
		position: 'absolute',
		left: 2 * SPACING,
		top: 2 * SPACING,
		width: BUTTON_ROUND_WIDTH,
		height: BUTTON_ROUND_WIDTH,
	}),
	buttonMaximize: RX.Styles.createViewStyle({
		position: 'absolute',
		width: 80,
		height: 100,
		backgroundColor: BUTTON_JITSI_BACKGROUND,
	}),
	containerIcon: RX.Styles.createViewStyle({
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	}),
};

enum CallWidgetActions {
	JoinCall = 'io.element.join',
	HangupCall = 'im.vector.hangup',
	TileLayout = 'io.element.tile_layout',
	SpotlightLayout = 'io.element.spotlight_layout',
	ScreenshareRequest = 'io.element.screenshare_request',
	ScreenshareStart = 'io.element.screenshare_start',
	ScreenshareStop = 'io.element.screenshare_stop',
}

enum WidgetApiFromWidgetAction {
	UpdateAlwaysOnScreen = 'set_always_on_screen',
}

enum DeviceKind {
	audioOutput = 'audiooutput',
	audioInput = 'audioinput',
	videoInput = 'videoinput',
}

enum CallEvents {
	GroupCallPrefix = 'org.matrix.msc3401.call',
	GroupCallMemberPrefix = 'org.matrix.msc3401.call.member',
}

interface ISendEventDetails {
	roomId: string;
	eventId: string;
}

interface ITurnServer {
	uris: string[];
	username: string;
	password: string;
}

interface IStickyActionRequestData extends IWidgetApiRequestData {
	value: boolean;
}

interface IStickyActionRequest extends IWidgetApiRequest {
	action: WidgetApiFromWidgetAction.UpdateAlwaysOnScreen;
	data: IStickyActionRequestData;
}

class CallWidgetDriver extends WidgetDriver {
	private callId = '';

	constructor(callId: string) {
		super();
		this.callId = callId;
	}

	public validateCapabilities(requested: Set<Capability>): Promise<Set<Capability>> {
		console.log('-----------------------VALIDATECAPABILITIES');
		return Promise.resolve(requested);
	}

	public async sendEvent(
		eventType: StateEventType,
		content: unknown,
		stateKey: string,
		roomId: string
	): Promise<ISendEventDetails> {
		type type_ = CallMemberEventContent_;
		const response = await ApiClient.sendStateEvent(roomId, eventType, content as type_, stateKey);

		return Promise.resolve({ eventId: response.event_id, roomId: roomId });
	}

	public sendToDevice(
		eventType: string,
		_encrypted: boolean,
		contentMap: { [userId: string]: { [deviceId: string]: object } }
	): Promise<void> {
		const transactionId = StringUtils.getRandomString(8);
		ApiClient.sendToDevice(eventType, transactionId, contentMap).catch(_error => null);

		return Promise.resolve();
	}

	public readStateEvents(
		eventType: ClientEventType,
		_stateKey: string | undefined,
		_limit: number,
		roomIds: string[]
	): Promise<IRoomEvent[]> {
		const roomSummary = DataStore.getRoomSummary(roomIds[0]);

		let stateEvents: IRoomEvent[] = [];
		if (eventType === 'm.room.member') {
			Object.values(roomSummary.members).map(member => {
				if (member.membership === 'join') {
					const memberEvent: IRoomEvent = {
						event_id: StringUtils.getRandomString(8),
						origin_server_ts: Date.now(),
						room_id: roomIds[0],
						sender: member.id,
						state_key: member.id,
						type: 'm.room.member',
						content: {
							displayname: member.id,
							membership: 'join',
						},
						unsigned: {},
					};
					stateEvents.push(memberEvent);
				}
			});
		} else if (eventType === CallEvents.GroupCallPrefix) {
			const content: CallEventContent_ = {
				'm.intent': GroupCallIntent.Prompt,
				'm.type': GroupCallType.Video,
				'io.element.ptt': false,
			};

			const stateEvent: IRoomEvent = {
				type: eventType,
				sender: ApiClient.credentials.userIdFull,
				event_id: StringUtils.getRandomString(8),
				room_id: roomIds[0],
				state_key: this.callId,
				origin_server_ts: Date.now(),
				content: content,
				unsigned: {},
			};

			stateEvents = [stateEvent];
		} else if (eventType === CallEvents.GroupCallMemberPrefix) {
			const timelineEvents = roomSummary.timelineEvents.slice(0).reverse();
			stateEvents = timelineEvents.filter(event => {
				const content = event.content as CallMemberEventContent_;
				return (
					event.type === eventType &&
					content['m.calls'][0] &&
					content['m.calls'][0]['m.call_id'] === this.callId
				);
			}) as IRoomEvent[];
			for (let i = 0; i < stateEvents.length; i++) {
				stateEvents[i].room_id = roomIds[0];
			}
		}

		return Promise.resolve(stateEvents);
	}

	public async *getTurnServers(): AsyncGenerator<ITurnServer> {
		const turnServer: ITurnServer = {
			uris: ['stun:turn.matrix.org'],
			username: '',
			password: '',
		};

		yield await Promise.resolve(turnServer);
	}
}

class WebView_ extends React.Component<WebViewProps> {
	public contentWindow: WebView_;
	// public listener!: string | boolean;
	private eventEmitter: EventEmitter;
	private webView: WebView | null;

	constructor(props: WebViewProps) {
		super(props);

		this.contentWindow = this;
		this.eventEmitter = new EventEmitter();
		this.webView = null;
	}

	public componentDidMount(): void {
		// do something
	}

	componentWillUnmount() {
		// if (this.listener) {
		// EventRegister.removeEventListener(this.listener as string)
		// }
		this.eventEmitter.removeAllListeners();
	}

	public addEventListener = (type: string, callback: () => void, _options?: boolean | AddEventListenerOptions) => {
		// this.listener = EventRegister.addEventListener(type, callback);

		console.log('---------------------IFRAME ADDEVENTLISTENER');
		console.log(type);

		this.eventEmitter.addListener(type, callback);
	};

	public postMessage = (message: string, targetOrigin?: string) => {
		console.log('---------------------POSTMESSAGE');
		console.log(message);
		console.log(targetOrigin);

		const jscode = `
			window.ReactNativeWebView.postMessage("message", ${message});
			true;
		`;
		this.webView!.injectJavaScript(jscode);
	};

	public render(): JSX.Element | null {
		return (
			<WebView
				{...this.props}
				ref={ref => {
					this.webView = ref;
				}}
			/>
		);
	}
}

interface ElementCallProps {
	roomId: string;
}

interface ElementCallState {
	parsedUrl: URL | undefined;
	isMinimized: boolean;
}

export default class ElementCall extends ComponentBase<ElementCallProps, ElementCallState> {
	private widgetUrl = '';
	private widgetApi?: ClientWidgetApi;
	private widget!: Widget;
	private widgetDriver!: CallWidgetDriver;
	// private widgetIframe: React.RefObject<HTMLIFrameElement> = React.createRef();
	// private widgetIframe: React.RefObject<WebView> = React.createRef();
	private widgetIframe!: WebView_ | null;
	// private webView_!: WebView_ | null;
	private completeUrl = '';
	private newMessageSubscription: number;
	private newCallEventSubscription: number;
	private callId = '';

	constructor(props: ElementCallProps) {
		super(props);

		console.log('---------------------CONSTRUCTOR');

		this.newMessageSubscription = DataStore.subscribe(this.newMessages, DataStore.MessageTrigger);
		this.newCallEventSubscription = DataStore.subscribe(this.newCallEvents, DataStore.CallEventTrigger);
	}

	public async componentDidMount(): Promise<void> {
		super.componentDidMount();
		RX.Modal.dismiss('dialog_menu_composer');

		console.log('---------------------COMPONENTDIDMOUNT 1');
		console.log(this.widgetIframe);

		const msc3401Call = DataStore.getRoomSummary(this.props.roomId).msc3401Call;

		if (!msc3401Call || !this.isActiveCall(msc3401Call)) {
			const content: CallEventContent_ = {
				'm.intent': GroupCallIntent.Prompt,
				'm.type': GroupCallType.Video,
				'io.element.ptt': false,
			};

			this.callId = StringUtils.getRandomString(8);

			ApiClient.sendStateEvent(this.props.roomId, CallEvents.GroupCallPrefix, content, this.callId).catch(
				_error => null
			);
		} else {
			this.callId = msc3401Call.callId;
		}

		const params = new URLSearchParams({
			embed: 'true',
			preload: 'true',
			hideHeader: 'true',
			hideScreensharing: 'true',
			userId: ApiClient.credentials.userIdFull,
			deviceId: ApiClient.credentials.deviceId,
			roomId: this.props.roomId,
			baseUrl: 'https://' + ApiClient.credentials.homeServer,
			enableE2e: 'false',
			lang: UiStore.getLanguage(),
		});

		const wellKnown = await ApiClient.getWellKnown(ApiClient.credentials.homeServer).catch(_error => undefined);
		const preferredDomain = wellKnown ? wellKnown['chat.quadrix.elementcall']?.preferredDomain : undefined;
		const elementCallUrl = preferredDomain ? 'https://' + preferredDomain : ELEMENT_CALL_URL;

		console.log('---------------------COMPONENTDIDMOUNT A');
		console.log(elementCallUrl);

		const url = new URL(elementCallUrl);

		console.log('---------------------COMPONENTDIDMOUNT B');
		console.log(url);

		url.pathname = '/room';

		console.log('---------------------COMPONENTDIDMOUNT C');

		url.hash = `#?${params.toString()}`;

		console.log('---------------------COMPONENTDIDMOUNT D');

		this.widgetUrl = url.toString();

		console.log('---------------------COMPONENTDIDMOUNT 2');
		console.log(this.widgetUrl);

		interface ICallWidget extends IWidget {
			roomId: string;
			eventId?: string;
			avatar_url?: string;
		}

		const callWidget: ICallWidget = {
			id: 'quadrixelementcallwidget',
			creatorUserId: ApiClient.credentials.userIdFull,
			type: 'm.custom',
			url: this.widgetUrl,
			roomId: this.props.roomId,
		};

		// this.widgetIframe!.postMessage('hello');
		// this.widgetIframe.props.onLoad(e => onLoad_(e))
		// this.widgetIframe
		/* 
		const callback = () => {
			//do something
		};

		this.widgetIframe?.contentWindow.addEventListener('load', callback);
 */

		// this.widgetIframe?.contentWindow.postMessage('hello');

		this.widget = new Widget(callWidget);

		console.log('---------------------COMPONENTDIDMOUNT 3');
		console.log(this.widget);
		// console.log(this.widget.origin || 'NOT FOUND')

		this.widgetDriver = new CallWidgetDriver(this.callId);
		// this.widgetApi = new ClientWidgetApi(this.widget, this.widgetIframe!, this.widgetDriver);

		console.log('---------------------COMPONENTDIDMOUNT 4');
		console.log(this.widgetDriver);
		console.log(this.widgetIframe);
		console.log(this.widgetIframe?.contentWindow);

		this.widgetApi = new ClientWidgetApi(
			this.widget,
			this.widgetIframe as unknown as HTMLIFrameElement,
			this.widgetDriver
		);

		console.log('---------------------COMPONENTDIDMOUNT 5');
		console.log(this.widgetApi);

		this.completeUrl = this.widget?.getCompleteUrl({
			widgetRoomId: this.props.roomId,
			currentUserId: ApiClient.credentials.userIdFull,
		});

		const parsedUrl = new URL(this.completeUrl);

		parsedUrl.searchParams.set('widgetId', this.widget.id);
		// parsedUrl.searchParams.set('parentUrl', window.location.href.split('#', 2)[0]);
		parsedUrl.searchParams.set('parentUrl', 'https://app.quadrix.chat');

		this.setState({ parsedUrl: parsedUrl });

		this.widgetApi.once('ready', this.onReady);
	}

	private onLoad = () => {
		console.log('-----------------------ONLOAD');
		// EventRegister.emit('load');
		const eventEmitter = new EventEmitter();
		eventEmitter.emit('load');
	};

	private onMessage = (message: WebViewMessageEvent) => {
		console.log('-----------------------ONMESSAGE');
		console.log(message);

		const messageEvent: MessageEvent = {
			data: undefined,
			lastEventId: '',
			origin: '',
			ports: [],
			source: null,
			initMessageEvent: function (
				_type: string,
				_bubbles?: boolean | undefined,
				_cancelable?: boolean | undefined,
				_data?: any,
				_origin?: string | undefined,
				_lastEventId?: string | undefined,
				_source?: MessageEventSource | null | undefined,
				_ports?: MessagePort[] | undefined
			): void {
				throw new Error('Function not implemented.');
			},
			bubbles: false,
			cancelBubble: false,
			cancelable: false,
			composed: false,
			currentTarget: null,
			defaultPrevented: false,
			eventPhase: 0,
			isTrusted: false,
			returnValue: false,
			srcElement: null,
			target: null,
			timeStamp: 0,
			type: 'xxxxxxx',
			composedPath: function (): EventTarget[] {
				throw new Error('Function not implemented.');
			},
			initEvent: function (
				_type: string,
				_bubbles?: boolean | undefined,
				_cancelable?: boolean | undefined
			): void {
				throw new Error('Function not implemented.');
			},
			preventDefault: function (): void {
				throw new Error('Function not implemented.');
			},
			stopImmediatePropagation: function (): void {
				throw new Error('Function not implemented.');
			},
			stopPropagation: function (): void {
				throw new Error('Function not implemented.');
			},
			AT_TARGET: 0,
			BUBBLING_PHASE: 0,
			CAPTURING_PHASE: 0,
			NONE: 0,
		};

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		this.widgetApi?.handleInboundMessage(messageEvent);
		// this.widgetIframe?.postMessage(message, )
	};

	public componentWillUnmount(): void {
		super.componentWillUnmount();

		DataStore.unsubscribe(this.newMessageSubscription);
		DataStore.unsubscribe(this.newCallEventSubscription);

		this.widgetApi?.off(`action:${CallWidgetActions.HangupCall}`, this.onHangup);
		this.widgetApi?.off(`action:${CallWidgetActions.TileLayout}`, this.onTileLayout);
		this.widgetApi?.off(`action:${WidgetApiFromWidgetAction.UpdateAlwaysOnScreen}`, this.onAlwaysOnScreen);
		this.widgetApi?.removeAllListeners();
		this.widgetApi?.stop();
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

			this.widgetApi!.feedEvent(event_, this.props.roomId).catch(_error => null);
		}
	};

	private newCallEvents = () => {
		const callEvents = DataStore.getCallEvents();

		callEvents.map(event => {
			if (event.content.conf_id === this.callId) {
				this.widgetApi!.feedToDevice(event as IRoomEvent, false).catch(_error => null);
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

	private onReady = async () => {
		const devices = await navigator.mediaDevices.enumerateDevices();

		const devices_: { [kind: MediaDeviceKind | string]: MediaDeviceInfo[] } = {
			[DeviceKind.audioOutput]: [],
			[DeviceKind.audioInput]: [],
			[DeviceKind.videoInput]: [],
		};

		devices.forEach(device => devices_[device.kind].push(device));

		await this.widgetApi!.transport.send(CallWidgetActions.JoinCall, {
			audioInput: 'Default', // devices_[DeviceKind.audioInput][0].label, // null for starting muted
			videoInput: 'Default', // devices_[DeviceKind.videoInput][0].label, // null for starting muted
		});

		this.widgetApi!.on(`action:${CallWidgetActions.HangupCall}`, this.onHangup);
		this.widgetApi!.on(`action:${CallWidgetActions.TileLayout}`, this.onTileLayout);
		this.widgetApi!.on(`action:${WidgetApiFromWidgetAction.UpdateAlwaysOnScreen}`, this.onAlwaysOnScreen);
	};

	private onTileLayout = (ev: CustomEvent<IWidgetApiRequest>) => {
		ev.preventDefault();
		this.widgetApi!.transport.reply(ev.detail, {});
	};

	private onAlwaysOnScreen = (ev: CustomEvent<IStickyActionRequest>) => {
		ev.preventDefault();
		this.widgetApi!.transport.reply(ev.detail, {});
	};

	private onHangup = (ev: CustomEvent<IWidgetApiRequest>): void => {
		ev.preventDefault();

		this.TerminateCall();

		this.widgetApi!.transport.reply(ev.detail, {});

		RX.Modal.dismiss('element_call');
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
		RX.Modal.dismissAll() // remove this
		this.setState({ isMinimized: isMinimized });
	};

	public render(): JSX.Element | null {
		console.log('---------------------RENDER');

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

		const widgetUrl = this.state?.parsedUrl?.toString().replace(/%24/g, '$');

		return (
			<RX.View
				style={this.state.isMinimized ? styles.containerMinimized : styles.container}
				// onLongPress={() => RX.Modal.dismissAll()}
			>
				<RX.View style={this.state.isMinimized ? styles.callContainerMinimized : styles.callContainer}>
					<WebView_
						style={{
							height: '100%',
							width: '100%',
							borderWidth: 0,
							borderRadius: BORDER_RADIUS,
						}}
						ref={ref => {
							this.widgetIframe = ref;
						}}
						source={{
							uri: widgetUrl!,
						}}
						// allow={'camera;microphone'}
						onLoad={this.onLoad}
						onMessage={this.onMessage}
					/>
					{buttonMinimize}
				</RX.View>
				{buttonMaximize}
			</RX.View>
		);
	}
}
