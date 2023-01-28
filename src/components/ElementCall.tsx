import React from 'react';
import RX from 'reactxp';
import { BORDER_RADIUS, OPAQUE_BACKGROUND, OPAQUE_DARK_BACKGROUND, TRANSPARENT_BACKGROUND } from '../ui';
import ApiClient from '../matrix/ApiClient';
import {
	WidgetDriver,
	ClientWidgetApi,
	Widget,
	IWidget,
	Capability,
	IWidgetApiRequest,
	IRoomEvent,
	IWidgetApiRequestData,
	IModalWidgetOpenRequestData,
	MatrixCapabilities,
} from 'matrix-widget-api';
import StringUtils from '../utils/StringUtils';
import DataStore from '../stores/DataStore';
import {
	GroupCallIntent,
	GroupCallType,
	CallEventContent_,
	MessageEventContent_,
	ClientEventType,
	ClientEvent_,
	StateEventContent_,
	StateEventType,
} from '../models/MatrixApi';
import UiStore from '../stores/UiStore';
import { ELEMENT_CALL_URL } from '../appconfig';

const styles = {
	modalView: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		justifyContent: 'flex-end',
		// backgroundColor: OPAQUE_BACKGROUND,
	}),
	closeButton: RX.Styles.createButtonStyle({
		position: 'absolute',
		width: 20,
		height: 20,
		bottom: 0,
		right: 0,
		backgroundColor: 'red',
		cursor: 'pointer',
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

interface IEventRelation {
	rel_type?: string;
	event_id?: string;
	is_falling_back?: boolean;
	'm.in_reply_to'?: {
		event_id?: string;
	};
	key?: string;
}

interface IContent {
	[key: string]: unknown;
	msgtype?: string;
	membership?: string;
	avatar_url?: string;
	displayname?: string;
	'm.relates_to'?: IEventRelation;
}

interface ISendEventDetails {
	roomId: string;
	eventId: string;
}

interface IReadEventRelationsResult {
	chunk: IRoomEvent[];
	nextBatch?: string;
	prevBatch?: string;
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

interface IWidgetApiRequestEmptyData extends IWidgetApiRequestData {}

enum SDPStreamMetadataPurpose {
	Usermedia = 'm.usermedia',
	Screenshare = 'm.screenshare',
}

interface IGroupCallRoomMemberFeed {
	purpose: SDPStreamMetadataPurpose;
}

interface IGroupCallRoomMemberDevice {
	device_id: string;
	session_id: string;
	expires_ts: number;
	feeds: IGroupCallRoomMemberFeed[];
}

interface IGroupCallRoomMemberCallState {
	'm.call_id': string;
	'm.foci'?: string[];
	'm.devices': IGroupCallRoomMemberDevice[];
}

interface IGroupCallRoomMemberState {
	'm.calls': IGroupCallRoomMemberCallState[];
}

class WidgetDriver_ extends WidgetDriver {
	// private callEventId = '';
	// constructor(callEventId: string) {
	// private roomId: string;

	constructor() {
		super();
		// this.callEventId = callEventId;
	}

	public validateCapabilities(requested: Set<Capability>): Promise<Set<Capability>> {
		console.log('##############_validateCapabilities')
		console.log(requested)
		return Promise.resolve(requested);
	}

	public sendEvent(
		eventType: string,
		content: unknown,
		stateKey: string,
		roomId: string
	): Promise<ISendEventDetails> {
		console.log('##############_sendEvent');
		console.log(eventType);
		console.log(content);
		console.log(stateKey);
		console.log(roomId);

		return Promise.resolve({ eventId: 'dummy', roomId: roomId });
	}

	public sendToDevice(
		eventType: string,
		encrypted: boolean,
		contentMap: { [userId: string]: { [deviceId: string]: object } }
	): Promise<void> {
		console.log('##############_sendToDevice');
		console.log(eventType);
		console.log(encrypted);
		console.log(contentMap);
		return Promise.resolve();
	}

	public readRoomEvents(
		eventType: string,
		msgtype: string | undefined,
		limit: number,
		roomIds: string[]
	): Promise<IRoomEvent[]> {
		console.log('##############_readRoomEvents');
		console.log(eventType);
		console.log(msgtype);
		console.log(limit);
		console.log(roomIds);
		return Promise.resolve([]);
	}

	public readStateEvents(
		eventType: string,
		stateKey: string | undefined,
		limit: number,
		roomIds: string[]
	): Promise<IRoomEvent[]> {
		console.log('##############_readStateEvents');
		console.log(eventType);
		console.log(stateKey);
		console.log(limit);
		console.log(roomIds);

		if (eventType === 'm.room.member') {
			// looks like this has to be done every time
			// it tells element call that the current user is a member of the room

			const memberEvent: IRoomEvent = {
				room_id: roomIds[0],
				// event_id: this.callEventId,
				event_id: StringUtils.getRandomString(8),
				content: {
					displayname: ApiClient.credentials.userIdFull,
					membership: 'join',
				},
				type: 'm.room.member',
				origin_server_ts: Date.now(),
				sender: ApiClient.credentials.userIdFull,
				state_key: ApiClient.credentials.userIdFull,
				unsigned: {},
			};

			return Promise.resolve([memberEvent]);
		} else if (eventType === CallEvents.GroupCallPrefix) {
			// here we need to check if a call event is available in the timeline
			// if not we need to send a call event to the homeserver, and then
			// return here that event (or a copy)
			// if call event is available, do we return here an empty object?

			const content: CallEventContent_ = {
				'm.intent': GroupCallIntent.Room,
				'm.type': GroupCallType.Video,
				'io.element.ptt': false,
				// 'dataChannelsEnabled': true,
				// 'dataChannelOptions': undefined,
			};

			// const callId = StringUtils.getRandomString(16);
			const callId = 'elementcall_' + roomIds[0];

			const callEvent: IRoomEvent = {
				room_id: roomIds[0],
				// event_id: this.callEventId,
				event_id: StringUtils.getRandomString(8),
				content: content as MessageEventContent_,
				type: CallEvents.GroupCallPrefix,
				origin_server_ts: Date.now(),
				sender: ApiClient.credentials.userIdFull,
				state_key: callId,
				unsigned: {},
			};

			return Promise.resolve([callEvent]);
		} else if (eventType === CallEvents.GroupCallMemberPrefix) {
			// what do we do here?
			// do we need to check if a callmember event is on the hs?
			// shouldn't element call know already who's in the call, who hung up, etc.
		}

		return Promise.resolve([]);
	}

	public readEventRelations(
		eventId: string,
		roomId?: string,
		relationType?: string,
		eventType?: string,
		from?: string,
		to?: string,
		limit?: number,
		direction?: 'f' | 'b'
	): Promise<IReadEventRelationsResult> {
		console.log('##############_readEventRelations');
		console.log(eventId);
		console.log(roomId);
		console.log(limit);
		console.log(relationType);
		console.log(eventType);
		console.log(from);
		console.log(to);
		console.log(direction);
		return Promise.resolve({ chunk: [] });
	}

	public askOpenID(observer: unknown) {
		console.log('##############_askOpenID');
		console.log(observer);
	}

	public navigate(uri: string): Promise<void> {
		console.log('##############_navigate');
		console.log(uri);
		return Promise.resolve();
	}

	public async *getTurnServers(): AsyncGenerator<ITurnServer> {
		// console.log('##############_getTurnServers')

		const turnServer: ITurnServer = {
			uris: [],
			username: '',
			password: '',
		};

		yield await Promise.resolve(turnServer);
	}

	/* 
	public readStateEvents(
        eventType: string,
        _stateKey: string | undefined,
        _limitPerRoom: number,
        roomIds: string[],
    ): Promise<IRoomEvent[]> {


		console.log('##############3')
		console.log(roomIds)
		console.log(eventType)
		console.log(this.callEventId)

		let roomEvents_: MatrixEvent_[] = [];
        for (const roomId of roomIds) {
			const roomSummary = DataStore.getRoomSummary(roomId)
			console.log(roomSummary)

			let roomEvents: MatrixEvent_[] = [];
			
			if (eventType === CallEvents.GroupCallPrefix) {

				const content: IGroupCallRoomState = {
					'm.intent': GroupCallIntent.Prompt,
					'm.type': GroupCallType.Video,
					// 'io.element.ptt': false,
					// 'dataChannelsEnabled': false,
					// 'dataChannelOptions': undefined,
				};

				const event: MatrixEvent_ = {
					event_id: this.callEventId,
					content: content,
					type: CallEvents.GroupCallPrefix,
					origin_server_ts: Date.now(),
					sender: ApiClient.credentials.userIdFull,
					state_key: 'dummycallid'
				}
		
				roomEvents.push(event);

			} else if (eventType === CallEvents.GroupCallMemberPrefix) {

				const content = {
					'm.calls': ['dummycallid']
				}

				const event: MatrixEvent_ = {
					event_id: 'dummyevent002',
					content: content as MessageEventContent_,
					type: CallEvents.GroupCallMemberPrefix as MessageEventType,
					origin_server_ts: Date.now(),
					sender: ApiClient.credentials.userIdFull,
					state_key: ApiClient.credentials.userId,
				}

				roomEvents.push(event);

			} else {

				roomEvents = roomSummary.stateEvents
					.filter(event => event.type === eventType)

			}
			
			console.log(roomEvents)

			roomEvents_ = roomEvents_.concat(roomEvents);
			console.log(roomEvents_)
		}


		return Promise.resolve(roomEvents_ as IRoomEvent[]);
	}
 */
	/* 
	public readRoomEvents(
        eventType: string,
        msgtype: string | undefined,
        _limitPerRoom: number,
        roomIds: string[],
    ): Promise<IRoomEvent[]> {


		console.log('##############2')

		let roomEvents_: MatrixEvent_[] = [];
        for (const roomId of roomIds) {
			const roomSummary = DataStore.getRoomSummary(roomId)
			const roomEvents = roomSummary.timelineEvents
				.filter(event => event.type === eventType && event.content.msgtype === msgtype)
			roomEvents_ = roomEvents_.concat(roomEvents);
		}

		console.log(roomEvents_)

		return Promise.resolve(roomEvents_ as IRoomEvent[]);
	}
 */

	public async sendEvent_____(
		eventType: string,
		content: IContent,
		stateKey: string,
		roomId: string
	): Promise<ISendEventDetails> {
		console.log('ooooooooooooooooooo1');
		console.log(eventType);

		let r: { event_id: string } | void;
		if (stateKey !== null) {
			// state event
			r = await ApiClient.sendStateEvent(
				roomId,
				eventType as StateEventType,
				content as StateEventContent_,
				stateKey
			);
		}
		/* 
		} else if (eventType === EventType.RoomRedaction) {
            // special case: extract the `redacts` property and call redact
            r = await client.redactEvent(roomId, content['redacts']);
        } else {
            // message event
            r = await client.sendEvent(roomId, eventType, content);

            if (eventType === EventType.RoomMessage) {
                CHAT_EFFECTS.forEach((effect) => {
                    if (containsEmoji(content, effect.emojis)) {
                        // For initial threads launch, chat effects are disabled
                        // see #19731
                        const isNotThread = content['m.relates_to'].rel_type !== THREAD_RELATION_TYPE.name;
                        if (!SettingsStore.getValue('feature_threadstable') || isNotThread) {
                            dis.dispatch({ action: `effects.${effect.command}` });
                        }
                    }
                });
            }
        }
 */
		return { roomId, eventId: r!.event_id };
	}
}

interface ElementCallProps {
	roomId: string;
}

interface ElementCallState {
	parsedUrl: URL;
}

export default class ElementCall extends RX.Component<ElementCallProps, ElementCallState> {
	private widgetUrl = '';
	private widgetApi?: ClientWidgetApi;
	private widget!: Widget;
	private widgetDriver!: WidgetDriver_;
	private widgetIframe: React.RefObject<HTMLIFrameElement> = React.createRef();
	private completeUrl = '';
	// private parsedUrl!: URL;
	public callEventId = '';

	constructor(props: ElementCallProps) {
		super(props);

		// ScreenOrientation.hideStatusBar(true);

		console.log('---------------------CONSTRUCTOR');
	}

	/* 
	// private sendResponse = (ev: unknown) => {
	private sendResponse = (ev: CustomEvent<IWidgetApiRequest>) => {
		ev.preventDefault();
		this.widgetApi?.transport.reply(ev.detail, {});
		console.log('****************')
		console.log(ev.type)
		console.log(ev.detail)
	}
 */

	private getActiveCallEvent = (roomId: string): ClientEvent_ | undefined => {
		const roomSummary = DataStore.getRoomSummary(roomId);
		console.log(roomSummary);

		const callEvent = roomSummary.timelineEvents.find(event => event.type === CallEvents.GroupCallPrefix);

		console.log(callEvent);

		return callEvent;
	};

	private sendCallEvent = async (): Promise<string> => {
		/* 		
		await ApiClient.sendStateEvent(
			this.props.roomId,
			ElementCall.MEMBER_EVENT_TYPE.name,
			{
				'm.calls': [
					{
						'm.call_id': call.groupCall.groupCallId,
						'm.devices': [
							{ device_id: 'bobweb', session_id: '1', feeds: [], expires_ts: 1000 * 60 * 10 },
							{ device_id: 'bobdesktop', session_id: '1', feeds: [], expires_ts: 1000 * 60 * 10 },
						],
					},
				],
			},
			bob.userId,
		);
 */

		const content: CallEventContent_ = {
			'm.intent': GroupCallIntent.Prompt,
			'm.type': GroupCallType.Video,
			// 'io.element.ptt': false,
			// 'dataChannelsEnabled': false,
			// 'dataChannelOptions': undefined,
		};

		console.log('****************1');
		console.log(content);
		console.log(this.props.roomId);

		const callId = StringUtils.getRandomString(16);

		const response = await ApiClient.sendStateEvent(this.props.roomId, CallEvents.GroupCallPrefix, content, callId);

		console.log('****************2');
		console.log(response.event_id);

		return Promise.resolve(response.event_id);
	};

	public async componentDidMount(): Promise<void> {
		// public componentDidMount(): void {
		RX.Modal.dismiss('dialog_menu_composer');

		const params = new URLSearchParams({
			// embed: 'true', // doesn't seem to do anything
			preload: 'true', // without this, element call starts in the lobby
			hideHeader: 'true',
			hideScreensharing: 'true',
			userId: ApiClient.credentials.userIdFull,
			deviceId: ApiClient.credentials.deviceId,
			roomId: this.props.roomId,
			baseUrl: 'https://' + ApiClient.credentials.homeServer,
			// enableE2e: 'false',
			lang: UiStore.getLanguage(),
		});

		// here we get the well-known based on the homeserver of the user
		// wouldn't it be better to get the well-known based on the homeserver of the room?
		// for example, alice is on matrix.org and bob is on mozilla.org
		// they have a dm chat hosted on matrix.org (i.e. roomid is 12345xyz:matrix.org)
		// the element call instance when any of them starts a call should probably be matrix.org
		// instead of being mozilla.org if bob initiates the call
		const wellKnown = await ApiClient.getWellKnown(ApiClient.credentials.homeServer).catch(_error => undefined);

		// console.log('---------------------1 WELLKNOWN')
		// console.log(wellKnown)

		const preferredDomain = wellKnown ? wellKnown['chat.quadrix.elementcall']?.preferredDomain : undefined;
		const elementCallUrl = preferredDomain ? 'https://' + preferredDomain : ELEMENT_CALL_URL;

		// console.log(elementCallUrl)

		// const url = new URL('https://call.al4.re');
		// const url = new URL('https://call.element.io');
		const url = new URL(elementCallUrl);
		url.pathname = '/room';
		url.hash = `#?${params.toString()}`;

		this.widgetUrl = url.toString();

		// console.log('---------------------1 WIDGETURL')
		// console.log(this.props.roomId)

		interface ICallWidget extends IWidget {
			roomId: string;
			eventId?: string;
			avatar_url?: string;
		}

		const callWidget: ICallWidget = {
			id: StringUtils.getRandomString(24),
			creatorUserId: ApiClient.credentials.userIdFull,
			type: 'm.custom',
			url: this.widgetUrl,
			roomId: this.props.roomId,
		};

		this.widget = new Widget(callWidget);

		this.widgetDriver = new WidgetDriver_();

		this.widgetApi = new ClientWidgetApi(this.widget, this.widgetIframe.current!, this.widgetDriver);

		// console.log('---------------------2 COMPONENTDIDMOUNT')
		// console.log(this.widgetApi)
		// console.log(this.widgetApi.canUseRoomTimeline(this.props.roomId))
		// console.log(this.widgetIframe.current)

		this.completeUrl = this.widget?.getCompleteUrl({
			// widgetRoomId: this.props.roomId,
			currentUserId: ApiClient.credentials.userIdFull,
			// userDisplayName: ApiClient.credentials.userIdFull,
			// clientId: APP_ID,
		});

		const parsedUrl = new URL(this.completeUrl);

		parsedUrl.searchParams.set('widgetId', this.widget.id);
		parsedUrl.searchParams.set('parentUrl', window.location.href.split('#', 2)[0]);

		this.setState({ parsedUrl: parsedUrl });

		this.widgetApi.once('preparing', this.onPreparing);
		this.widgetApi.once('ready', this.onReady);
	}

	public componentWillUnmount(): void {
		// this.widgetApi!.off('preparing', this.onPreparing);
		// this.widgetApi!.off('ready', this.onReady);
		this.widgetApi!.off(`action:${CallWidgetActions.HangupCall}`, this.onHangup);
		this.widgetApi!.off(`action:${CallWidgetActions.TileLayout}`, this.onTileLayout);
		this.widgetApi!.off(`action:${WidgetApiFromWidgetAction.UpdateAlwaysOnScreen}`, this.onAlwaysOnScreen);
		this.widgetApi!.off(`action:${CallWidgetActions.JoinCall}`, this.onJoin);
		this.widgetApi!.stop();
	}

	private onPressCloseButton = () => {
		// ScreenOrientation.hideStatusBar(false);

		RX.Modal.dismiss('element_call');
	};

	private onPreparing = () => {
		// not used
		// console.log('++++++++++++++++++++++ ON PREPARING')
	};

	private onReady = async () => {
		/* 
		console.log('---------------------4 ON READY')
		console.log('canUseRoomTimeline', this.widgetApi!.canUseRoomTimeline(this.props.roomId))
		console.log('canReceiveRoomEvent', this.widgetApi!.canReceiveRoomEvent(this.props.roomId))
		console.log('canSendRoomEvent', this.widgetApi!.canSendRoomEvent(this.props.roomId))
		console.log('canReceiveStateEvent', this.widgetApi!.canReceiveStateEvent(CallEvents.GroupCallPrefix, 'dummycallid'))
		console.log('canSendStateEvent', this.widgetApi!.canSendStateEvent(CallEvents.GroupCallPrefix, 'dummycallid'))
		console.log('canReceiveToDeviceEvent', this.widgetApi!.canReceiveToDeviceEvent('m.call'))
		console.log('canSendToDeviceEvent', this.widgetApi!.canSendToDeviceEvent('m.call'))
		console.log('AlwaysOnScreen', this.widgetApi!.hasCapability(MatrixCapabilities.AlwaysOnScreen))
		console.log('Screenshots', this.widgetApi!.hasCapability(MatrixCapabilities.Screenshots))
 */
		// this.widgetApi.

		/* 
		const widgetConfig: IModalWidgetOpenRequestData = {
			// type: 'm.custom',
			// url: this.widgetUrl,

		};

		console.log(widgetConfig)

		this.widgetApi!.sendWidgetConfig(widgetConfig)
		.then(response => {
			console.log('---------------------5A')
			console.log(response)
		})
		.catch(error => {
			console.log('---------------------5B')
			console.log(error)
		});
 */

		/* 
		const event_: IRoomEvent = {
			room_id: this.props.roomId,
			// event_id: this.callEventId,
			event_id: 'eventid002',
			content: {},
			type: CallEvents.GroupCallMemberPrefix,
			origin_server_ts: Date.now(),
			sender: ApiClient.credentials.userIdFull,
			state_key: ApiClient.credentials.userIdFull,
			unsigned: {}
		}

		await this.widgetApi!.feedEvent(event_, this.props.roomId)
		.then(response => {
			console.log('---------------------16 MEMBER FEED EVENT RESPONSE')
			console.log(response)
	
		})
		.catch(error => {
			console.log('---------------------17 MEMBER FEED EVENT ERROR')
			console.log(error)
		})

 */

		/* 
		const event_: IRoomEvent = {
			room_id: this.props.roomId,
			// event_id: this.callEventId,
			event_id: StringUtils.getRandomString(16),
			content: {
				displayname: ApiClient.credentials.userIdFull,
				membership: 'join',
			},
			type: 'm.room.member',
			origin_server_ts: Date.now(),
			sender: ApiClient.credentials.userIdFull,
			state_key: ApiClient.credentials.userIdFull,
			unsigned: {}
		}

		await this.widgetApi!.feedEvent(event_, this.props.roomId)
		.then(response => {
			console.log('---------------------16 MEMBER FEED EVENT RESPONSE')
			console.log(response)
	
		})
		.catch(error => {
			console.log('---------------------17 MEMBER FEED EVENT ERROR')
			console.log(error)
		})
 */
		/* 
		const content: IGroupCallRoomState = {
			'm.intent': GroupCallIntent.Room,
			'm.type': GroupCallType.Video,
			'io.element.ptt': false,
			// 'dataChannelsEnabled': true,
			// 'dataChannelOptions': undefined,
		};

		// const callId = StringUtils.getRandomString(16);
		const callId = 'elementcall_' + this.props.roomId;
		
		const event: IRoomEvent = {
			room_id: this.props.roomId,
			// event_id: this.callEventId,
			event_id: StringUtils.getRandomString(16),
			content: content as MessageEventContent_,
			type: CallEvents.GroupCallPrefix,
			origin_server_ts: Date.now(),
			sender: ApiClient.credentials.userIdFull,
			state_key: callId,
			unsigned: {}
		}

		await this.widgetApi!.feedEvent(event, this.props.roomId)
		.then(response => {
			console.log('---------------------13 FEED EVENT RESPONSE')
			console.log(response)
	
		})
		.catch(error => {
			console.log('---------------------14 FEED EVENT ERROR')
			console.log(error)
		})
 */
		/* 
		const data: IWidgetApiRequestData = {
			room_id: this.props.roomId,
			event_id: this.callEventId,
			content: content as MessageEventContent_,
			type: CallEvents.GroupCallPrefix,
			origin_server_ts: Date.now(),
			sender: ApiClient.credentials.userIdFull,
			state_key: callId,
		}

		this.widgetApi!.transport.send('action:send_event', data)
		.then(response => {
			console.log('---------------------7')
			console.log(response)
	
		})
		.catch(error => {
			console.log('---------------------8')
			console.log(error)
		})
 */

		const devices = await navigator.mediaDevices.enumerateDevices();

		// console.log('---------------------15')
		// console.log(devices)

		const devices_: { [kind: MediaDeviceKind | string]: MediaDeviceInfo[] } = {
			[DeviceKind.audioOutput]: [],
			[DeviceKind.audioInput]: [],
			[DeviceKind.videoInput]: [],
		};

		devices.forEach(device => devices_[device.kind].push(device));

		// console.log(devices_)
		// console.log(devices_['audioinput'][0])
		// console.log(devices_['videoinput'][0])

		await this.widgetApi!.transport.send(CallWidgetActions.JoinCall, {
			audioInput: null, // devices_[DeviceKind.audioInput][0].label, // null for starting muted
			videoInput: null, // devices_[DeviceKind.videoInput][0].label, // null for starting muted
		});

		this.widgetApi!.on(`action:${CallWidgetActions.HangupCall}`, this.onHangup);

		this.widgetApi!.on(`action:${CallWidgetActions.TileLayout}`, this.onTileLayout);

		this.widgetApi!.on(`action:${WidgetApiFromWidgetAction.UpdateAlwaysOnScreen}`, this.onAlwaysOnScreen);

		this.widgetApi!.on(`action:${CallWidgetActions.JoinCall}`, this.onJoin);
		/* 
		// this seems to also pick up all above actions and some widget driver functions
		// could be an alternative for implementing widget internal messaging
		this.widgetApi!.transport.on('message', (ev: CustomEvent<IWidgetApiRequest>) => {
			ev.preventDefault();
			console.log('++++++++++++++++++++++ ON MESSAGE')
			console.log(ev)
		})
 */
	};

	private onJoin = (ev: CustomEvent<IWidgetApiRequest>) => {
		console.log('++++++++++++++++++++++ ON JOIN');
		console.log(ev);

		// ev.preventDefault();
		// await this.widgetApi!.transport.reply(ev.detail, {});
	};

	private onTileLayout = async (ev: CustomEvent<IWidgetApiRequest>): Promise<void> => {
		// console.log('++++++++++++++++++++++ ON TILE LAYOUT')
		// console.log(ev)

		// do something with the tile layout?

		ev.preventDefault();
		await this.widgetApi!.transport.reply(ev.detail, {});
	};

	private onAlwaysOnScreen = async (ev: CustomEvent<IStickyActionRequest>) => {
		// console.log('++++++++++++++++++++++ ON ALWAYS ON SCREEN')
		// console.log(ev)

		ev.preventDefault();
		await this.widgetApi!.transport.reply(ev.detail, {});

		// const x: IWidgetApiRequestEmptyData = {};
		// this.widgetApi!.transport.reply(ev.detail, x);
	};

	private onHangup = async (ev: CustomEvent<IWidgetApiRequest>): Promise<void> => {
		// console.log('++++++++++++++++++++++ ON HANGUP')
		// console.log(ev)

		ev.preventDefault();
		await this.widgetApi!.transport.reply(ev.detail, {});
		RX.Modal.dismiss('element_call');
	};

	private onLoad = () => {
		// not used
		// console.log('---------------------3 ON LOAD')
		// console.log(this.widgetApi)
		// const stateEvents = ApiClient.getStateEvents(this.props.roomId);
		// console.log(stateEvents)
		// this.widgetApi!.once('ready', this.onReady);
	};

	public render(): JSX.Element | null {
		// console.log('---------------------6 RENDER')

		// const templateUrl = this.widget.templateUrl;

		// console.log(templateUrl)

		// console.log(parsedUrl)

		const widgetUrl = this.state?.parsedUrl?.toString().replace(/%24/g, '$');

		// console.log(widgetUrl)

		const iframeRatio = 1.7;
		const height = 260; // 220;
		const width = height * iframeRatio;

		return (
			<RX.View style={styles.modalView}>
				<RX.View style={{ margin: 20 }}>
					<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<iframe
							style={{ height: height, width: width, borderWidth: 0, borderRadius: BORDER_RADIUS }}
							// title={'Video Call'}
							ref={this.widgetIframe}
							// sandbox={'allow-forms allow-scripts allow-same-origin'}
							src={widgetUrl}
							onLoad={this.onLoad}
							allow={'camera;microphone'}
						/>
					</div>
					<RX.View
						style={styles.closeButton}
						onPress={this.onPressCloseButton}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					/>
				</RX.View>
			</RX.View>
		);
	}
}
