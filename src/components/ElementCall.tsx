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
} from 'matrix-widget-api';
import StringUtils from '../utils/StringUtils';
import DataStore from '../stores/DataStore';
import {
	GroupCallIntent,
	GroupCallType,
	CallEventContent_,
	ClientEventType,
	StateEventType,
	CallMemberEventContent_,
} from '../models/MatrixApi';
import UiStore from '../stores/UiStore';
import { ELEMENT_CALL_URL } from '../appconfig';
import { ComponentBase } from 'resub';
import { Msc3401Call } from '../models/Msc3401Call';

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

class WidgetDriver_ extends WidgetDriver {
	private callId = '';

	constructor(callId: string) {
		super();
		this.callId = callId;
	}

	public validateCapabilities(requested: Set<Capability>): Promise<Set<Capability>> {
		console.log('##############_validateCapabilities');
		console.log(requested);
		return Promise.resolve(requested);
	}

	public async sendEvent(
		eventType: StateEventType,
		content: unknown,
		stateKey: string,
		roomId: string
	): Promise<ISendEventDetails> {
		console.log('##############_sendEvent');
		console.log(eventType);
		console.log(content);
		console.log(stateKey);
		console.log(roomId);

		// seems to only get org.matrix.msc3401.call.member events here

		type type_ = CallMemberEventContent_;

		const response = await ApiClient.sendStateEvent(roomId, eventType, content as type_, stateKey);

		console.log(response);

		return Promise.resolve({ eventId: response.event_id, roomId: roomId });
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

		const transactionId = StringUtils.getRandomString(8);
		ApiClient.sendToDevice(eventType, transactionId, contentMap)
			.then(response => {
				console.log('...............RESPONSE');
				console.log(response);
			})
			.catch(error => {
				console.log('...............ERROR');
				console.log(error);
			});

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
		eventType: ClientEventType,
		stateKey: string | undefined,
		limit: number,
		roomIds: string[]
	): Promise<IRoomEvent[]> {
		console.log('##############_readStateEvents');
		console.log(eventType);
		console.log(stateKey);
		console.log(limit);
		console.log(roomIds);

		const roomSummary = DataStore.getRoomSummary(roomIds[0]);
		console.log(roomSummary);

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
			// there is a race condition here for the user launching the call
			// this hopefully executes after the sync has received the call event
			// sent at componentdidmount

			// const stateEvent = timelineEvents.find(event => event.type === eventType) as IRoomEvent;
			// stateEvent.room_id = roomIds[0]; // need to fill in room_id property, why???

			const content: CallEventContent_ = {
				'm.intent': GroupCallIntent.Prompt,
				'm.type': GroupCallType.Video,
				'io.element.ptt': false,
				// 'dataChannelsEnabled': true,
				// 'dataChannelOptions': undefined,
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

			// this.callId = stateEvent.state_key!;
			// console.log('callId: ', this.callId);
		} else if (eventType === CallEvents.GroupCallMemberPrefix) {
			// sending only the call member events which match the callId
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

		console.log(stateEvents);

		return Promise.resolve(stateEvents);
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
		console.log('##############_getTurnServers');

		const turnServer: ITurnServer = {
			uris: ['stun:turn.matrix.org'],
			username: '',
			password: '',
		};

		yield await Promise.resolve(turnServer);
	}
}

interface ElementCallProps {
	roomId: string;
}

interface ElementCallState {
	parsedUrl: URL;
}

export default class ElementCall extends ComponentBase<ElementCallProps, ElementCallState> {
	private widgetUrl = '';
	private widgetApi?: ClientWidgetApi;
	private widget!: Widget;
	private widgetDriver!: WidgetDriver_;
	private widgetIframe: React.RefObject<HTMLIFrameElement> = React.createRef();
	private completeUrl = '';
	private newMessageSubscription: number;
	private newCallEventSubscription: number;
	private callId = '';

	constructor(props: ElementCallProps) {
		super(props);

		console.log('---------------------CONSTRUCTOR');
		console.log(props);

		this.newMessageSubscription = DataStore.subscribe(this.newMessages, DataStore.MessageTrigger);
		this.newCallEventSubscription = DataStore.subscribe(this.newCallEvents, DataStore.CallEventTrigger);
	}

	public async componentDidMount(): Promise<void> {
		super.componentDidMount();
		RX.Modal.dismiss('dialog_menu_composer');

		console.log('---------------------COMPONENTDIDMOUNT');

		const msc3401Call = DataStore.getRoomSummary(this.props.roomId).msc3401Call;

		console.log('msc3401Call: ', msc3401Call);

		if (!msc3401Call || !this.isActiveCall(msc3401Call)) {
			const content: CallEventContent_ = {
				'm.intent': GroupCallIntent.Prompt,
				'm.type': GroupCallType.Video,
				'io.element.ptt': false,
				// 'dataChannelsEnabled': true,
				// 'dataChannelOptions': undefined,
			};

			this.callId = StringUtils.getRandomString(8);

			console.log('callId: ', this.callId);

			ApiClient.sendStateEvent(this.props.roomId, CallEvents.GroupCallPrefix, content, this.callId).catch(
				_error => null
			);
		} else {
			this.callId = msc3401Call.callId;
		}

		const params = new URLSearchParams({
			embed: 'true', // without this, element call starts in the lobby
			preload: 'true', // what does this do?
			hideHeader: 'true',
			hideScreensharing: 'true',
			userId: ApiClient.credentials.userIdFull,
			deviceId: ApiClient.credentials.deviceId,
			roomId: this.props.roomId,
			baseUrl: 'https://' + ApiClient.credentials.homeServer,
			enableE2e: 'false',
			lang: UiStore.getLanguage(),
		});

		// here we get the well-known based on the homeserver of the user
		// wouldn't it be better to get the well-known based on the homeserver of the room?
		// for example, alice is on matrix.org and bob is on mozilla.org
		// they have a dm chat hosted on matrix.org (i.e. roomid is 12345xyz:matrix.org)
		// the element call instance when any of them starts a call should probably be matrix.org
		// instead of being mozilla.org if bob initiates the call
		const wellKnown = await ApiClient.getWellKnown(ApiClient.credentials.homeServer).catch(_error => undefined);
		const preferredDomain = wellKnown ? wellKnown['chat.quadrix.elementcall']?.preferredDomain : undefined;
		const elementCallUrl = preferredDomain ? 'https://' + preferredDomain : ELEMENT_CALL_URL;

		console.log(elementCallUrl);

		// const url = new URL('https://call.al4.re');
		// const url = new URL('https://call.element.io');
		// const url = new URL('https://element-call.netlify.app/');
		const url = new URL(elementCallUrl);
		url.pathname = '/room';
		url.hash = `#?${params.toString()}`;

		this.widgetUrl = url.toString();

		interface ICallWidget extends IWidget {
			roomId: string;
			eventId?: string;
			avatar_url?: string;
		}

		const callWidget: ICallWidget = {
			id: 'quadrixelementcallwidget', // StringUtils.getRandomString(8),
			creatorUserId: ApiClient.credentials.userIdFull,
			type: 'm.custom',
			url: this.widgetUrl,
			roomId: this.props.roomId,
		};

		this.widget = new Widget(callWidget);
		this.widgetDriver = new WidgetDriver_(this.callId);
		this.widgetApi = new ClientWidgetApi(this.widget, this.widgetIframe.current!, this.widgetDriver);

		// what is this
		this.completeUrl = this.widget?.getCompleteUrl({
			widgetRoomId: this.props.roomId,
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
		super.componentWillUnmount();
		console.log('---------------------COMPONENTWILLUNMOUNT');

		DataStore.unsubscribe(this.newMessageSubscription);
		DataStore.unsubscribe(this.newCallEventSubscription);

		this.widgetApi!.off(`action:${CallWidgetActions.HangupCall}`, this.onHangup);
		this.widgetApi!.off(`action:${CallWidgetActions.TileLayout}`, this.onTileLayout);
		this.widgetApi!.off(`action:${WidgetApiFromWidgetAction.UpdateAlwaysOnScreen}`, this.onAlwaysOnScreen);
		this.widgetApi!.off(`action:${CallWidgetActions.JoinCall}`, this.onJoin);
		this.widgetApi!.removeAllListeners();
		this.widgetApi!.stop();
	}

	private newMessages = () => {
		console.log('---------------------NEWMESSAGES');
		const newRoomEvents = DataStore.getNewRoomEvents(this.props.roomId);

		console.log(newRoomEvents);

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

			this.widgetApi!.feedEvent(event_, this.props.roomId)
				.then(response => {
					console.log('---------------------FEEDEVENTRESPONSE');
					console.log(response);
				})
				.catch(error => {
					console.log('---------------------FEEDEVENTERROR');
					console.log(error);
				});
		}
	};

	private newCallEvents = () => {

		// do something
		const callEvents = DataStore.getCallEvents();
		console.log('---------------------NEWCALLEVENTS');
		console.log(callEvents)

		callEvents.map(event => {
			console.log(event.content.conf_id)
			console.log(this.callId)
			if (event.content.conf_id === this.callId) {
				this.widgetApi!.feedToDevice(event as IRoomEvent, false)
				.then(response => {
					console.log('---------------------FEEDEVENTRESPONSE');
					console.log(response);
				})
				.catch(error => {
					console.log('---------------------FEEDEVENTERROR');
					console.log(error);
				});
			}
		})
	}

	private isActiveCall = (msc3401Call: Msc3401Call): boolean => {
		console.log('---------------------ISACTIVECALL');

		if (msc3401Call.callEventContent?.['m.terminated'] || !msc3401Call.participants) {
			return false;
		}

		const activeParticipants = Object.entries(msc3401Call.participants).filter(
			participant => participant[1] === true
		);

		return activeParticipants.length > 0;
	};

	private onPressCloseButton = () => {
		RX.Modal.dismiss('element_call');
	};

	private onPreparing = () => {
		console.log('---------------------ONPREPARING');
		// not used
	};

	private onReady = async () => {
		console.log('---------------------ONREADY');

		// this.widgetApi?.updateVisibility(true).catch(_error => null);
		/* 
		const devices = await navigator.mediaDevices.enumerateDevices();

		const devices_: { [kind: MediaDeviceKind | string]: MediaDeviceInfo[] } = {
			[DeviceKind.audioOutput]: [],
			[DeviceKind.audioInput]: [],
			[DeviceKind.videoInput]: [],
		};

		devices.forEach(device => devices_[device.kind].push(device));
 */
		await this.widgetApi!.transport.send(CallWidgetActions.JoinCall, {
			audioInput: null, // 'default', // devices_[DeviceKind.audioInput][0].label, // null for starting muted
			videoInput: null, // 'default', // devices_[DeviceKind.videoInput][0].label, // null for starting muted
		});

		this.widgetApi!.on(`action:${CallWidgetActions.HangupCall}`, this.onHangup);
		this.widgetApi!.on(`action:${CallWidgetActions.TileLayout}`, this.onTileLayout);
		this.widgetApi!.on(`action:${WidgetApiFromWidgetAction.UpdateAlwaysOnScreen}`, this.onAlwaysOnScreen);
		this.widgetApi!.on(`action:${CallWidgetActions.JoinCall}`, this.onJoin);

		// this.widgetApi!.on(`action:io.element.view_room`, this.onViewRoom);

		// this.widgetApi!.on('event', this.onEvent);

		this.widgetApi!.on('toDeviceEvent', this.onToDeviceEvent);
	};

	private onToDeviceEvent = (ev: CustomEvent<IWidgetApiRequest>) => {
		console.log('++++++++++++++++++++++ONTODEVICEEVENT');
		console.log(ev);
	};

	private onViewRoom = (ev: CustomEvent<IWidgetApiRequest>) => {
		console.log('++++++++++++++++++++++ONVIEWROOM');
		console.log(ev);
	};

	private onEvent = (ev: CustomEvent<IWidgetApiRequest>) => {
		console.log('++++++++++++++++++++++ONEVENT');
		console.log(ev);
	};

	private onJoin = (ev: CustomEvent<IWidgetApiRequest>) => {
		ev.preventDefault();
		console.log(ev);
		console.log('++++++++++++++++++++++ONJOIN');
		// await this.widgetApi!.transport.reply(ev.detail, {});
	};

	private onTileLayout = (ev: CustomEvent<IWidgetApiRequest>) => {
		ev.preventDefault();
		console.log('++++++++++++++++++++++ONTILELAYOUT');
		this.widgetApi!.transport.reply(ev.detail, {});
	};

	private onAlwaysOnScreen = (ev: CustomEvent<IStickyActionRequest>) => {
		ev.preventDefault();
		console.log('++++++++++++++++++++++ONALWAYSONSCREEN');
		this.widgetApi!.transport.reply(ev.detail, {});
	};

	private onHangup = async (ev: CustomEvent<IWidgetApiRequest>): Promise<void> => {
		ev.preventDefault();
		console.log('++++++++++++++++++++++ONHANGUP');
		// console.log(this.isActiveCall())

		// if last user, send a state event to end the call
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
					// 'dataChannelsEnabled': true,
					// 'dataChannelOptions': undefined,
				};

				const response = await ApiClient.sendStateEvent(
					this.props.roomId,
					CallEvents.GroupCallPrefix,
					content,
					roomSummary.msc3401Call.callId
				).catch(_error => null);

				console.log('****************SENDCALLEVENTRESPONSE');
				console.log(response?.event_id);
			}
		}

		await this.widgetApi!.transport.reply(ev.detail, {});

		RX.Modal.dismiss('element_call');
	};

	private onLoad = () => {
		// not used
	};

	public render(): JSX.Element | null {
		const widgetUrl = this.state?.parsedUrl?.toString().replace(/%24/g, '$');

		const iframeRatio = 2; // 1;
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
