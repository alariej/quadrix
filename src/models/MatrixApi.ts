// TODO: move this somewhere else
export type RoomType = 'direct' | 'group' | 'community' | 'notepad';

export type RoomPhase = 'join' | 'invite' | 'leave' | 'knock' | 'ban';

export type LoginIdentifierType = 'm.id.user' | 'm.id.thirdparty' | 'm.id.phone';

export type LoginParamType = 'm.login.password' | 'm.login.token';

export type RegisterStageType = 'm.login.recaptcha' | 'm.login.terms' | 'm.login.dummy' | 'm.login.email.identity';

export type StateEventType =
	| 'm.room.create'
	| 'm.room.name'
	| 'm.room.avatar'
	| 'm.room.topic'
	| 'm.room.join_rules'
	| 'm.room.canonical_alias'
	| 'm.room.encryption'
	| 'org.matrix.msc3401.call'
	| 'org.matrix.msc3401.call.member';

export type ClientEventType =
	| 'm.room.third_party_invite'
	| 'm.room.redaction'
	| 'm.room.message'
	| 'm.room.member'
	| 'm.room.name'
	| 'm.room.avatar'
	| 'm.room.canonical_alias'
	| 'm.room.join_rules'
	| 'm.room.power_levels'
	| 'm.room.topic'
	| 'm.room.encrypted'
	| 'm.room.create'
	| 'm.room.encryption'
	| 'm.receipt'
	| 'm.direct'
	| 'm.push_rules'
	| 'm.presence'
	| 'org.matrix.msc3401.call'
	| 'org.matrix.msc3401.call.member';

export type MessageContentType = 'm.text' | 'm.image' | 'm.video' | 'm.file';

export type EphemeralEventType = 'm.receipt';

export interface LoginParam_ {
	user: string;
	identifier: {
		type: LoginIdentifierType;
		user: string;
	};
	type?: LoginParamType;
	password?: string;
	session?: string;
}

export interface LoginResponse_ {
	user_id: string;
	access_token: string;
	device_id: string;
	home_server: string;
}

export interface AuthParam_ {
	type: RegisterStageType;
	session?: string;
	response?: string; // captcha token
	threepid_creds?: { sid: string; client_secret: string };
	threepidCreds?: { sid: string; client_secret: string };
}

export interface LinkPreview_ {
	url: string;
	text?: string;
	image_url?: string;
	image_width?: number;
	image_height?: number;
	title?: string;
	site_name?: string;
}

export interface PreviewUrl_ {
	'og:image': string;
	'og:image:width': number;
	'og:image:height': number;
	'og:title': string;
	'og:site_name': string;
}

export interface UnsignedData_ {
	age?: number;
	prev_content?:
		| MessageEventContent_
		| RoomEventContent_
		| MemberEventContent_
		| CallEventContent_
		| PresenceEventContent_;
	redacted_because?: ClientEvent_;
	transaction_id?: string;
	membership?: RoomPhase;
	'm.relations'?: {
		'm.replace'?: {
			event_id?: string;
			origin_server_ts?: number;
			sender?: string;
		};
	};
}

export interface ClientEvent_ {
	type: ClientEventType;
	content: MessageEventContent_ | RoomEventContent_ | MemberEventContent_ | CallEventContent_ | PresenceEventContent_;
	event_id: string;
	origin_server_ts: number;
	room_id: string;
	sender: string;
	state_key?: string;
	unsigned?: UnsignedData_;
	redacts?: string;
}

export interface ThumbnailInfo_ {
	mimetype: string;
	size: number;
	h: number;
	w: number;
}

export interface ImageInfo_ {
	mimetype?: string;
	size?: number;
	h?: number;
	w?: number;
	thumbnail_url?: string;
	thumbnail_info?: ThumbnailInfo_;
	thumbnail_file?: unknown; // encrypted file
}

export interface VideoInfo_ {
	mimetype?: string;
	duration?: number;
	size?: number;
	h?: number;
	w?: number;
	thumbnail_url?: string;
	thumbnail_info?: ThumbnailInfo_;
	thumbnail_file?: unknown; // encrypted file
}

export interface FileInfo_ {
	mimetype?: string;
	size?: number;
	thumbnail_url?: string;
	thumbnail_info?: ThumbnailInfo_;
	thumbnail_file?: unknown; // encrypted file
}

export interface AudioInfo_ {
	mimetype?: string;
	size?: number;
	duration?: number;
}

export interface LocationInfo_ {
	thumbnail_url?: string;
	thumbnail_info?: ThumbnailInfo_;
	thumbnail_file?: unknown; // encrypted file
}

export interface MessageEventContent_ {
	msgtype?: MessageContentType;
	body?: string;
	format?: string;
	formatted_body?: string;
	info?: ImageInfo_ | VideoInfo_ | FileInfo_ | AudioInfo_ | LocationInfo_;
	url?: string;
	filename?: string;
	file?: unknown; // encrypted file
	geo_uri?: string;
	'm.new_content'?: {
		body?: string;
		msgtype?: MessageContentType;
		_time?: number; // custom field
	};
	'm.relates_to'?: {
		event_id?: string;
		is_falling_back?: boolean;
		rel_type?: string;
		'm.in_reply_to'?: { [event_id: string]: string };
	};
	_jitsi_started?: boolean; // custom field
	_url_preview?: LinkPreview_; // custom field
	_time?: number; // custom field
}

export interface MemberEventContent_ {
	avatar_url?: string;
	displayname?: string;
	display_name?: string;
	membership?: RoomPhase;
	is_direct?: boolean;
	join_authorised_via_users_server?: string;
	reason?: string;
	third_party_signed?: string;
	third_party_invite?: {
		display_name: string;
		signed: {
			mxid: string;
			signatures: unknown;
			token: string;
		};
	};
}

export interface RoomEventContent_ {
	name?: string;
	alias?: string;
	url?: string;
	info?: ImageInfo_;
	join_rule?: string;
	topic?: string;
	users?: { [id: string]: number };
	_is_notepad?: string; // custom field
}

export interface IGroupCallDataChannelOptions {
	ordered: boolean;
	maxPacketLifeTime: number;
	maxRetransmits: number;
	protocol: string;
}

export enum GroupCallType {
	Video = 'm.video',
	Voice = 'm.voice',
}

export enum GroupCallIntent {
	Ring = 'm.ring',
	Prompt = 'm.prompt',
	Room = 'm.room',
}

interface IGroupCallRoomState {
	'm.intent': GroupCallIntent;
	'm.type': GroupCallType;
	'io.element.ptt'?: boolean;
	dataChannelsEnabled?: boolean;
	dataChannelOptions?: IGroupCallDataChannelOptions;
	'm.terminated'?: string;
}

export type CallEventContent_ = IGroupCallRoomState;

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

export type CallMemberEventContent_ = IGroupCallRoomMemberState;

export interface PresenceEventContent_ {
	last_active_ago?: number;
}

export interface PusherParam_ {
	append?: boolean;
	app_display_name?: string;
	app_id: string;
	data: {
		url?: string;
		lang?: string;
		locale?: string;
		format?: string;
		client_version?: string;
	};
	device_display_name?: string;
	kind: string | null;
	lang?: string;
	profile_tag?: string;
	pushkey: string;
}

export interface PusherGetResponse_ {
	pushers: PusherParam_[];
}

export interface PushRulesGetResponse_ {
	content: {
		actions: string[];
		default: boolean;
		enabled: boolean;
		pattern: string;
		rule_id: string;
	}[];
	override: {
		actions: string[];
		conditions: {
			key: string;
			kind: string;
			pattern: string;
		}[];
		default: boolean;
		enabled: boolean;
		rule_id: string;
	}[];
	underride: {
		actions: string[];
		conditions: {
			key: string;
			kind: string;
			pattern: string;
		}[];
		default: boolean;
		enabled: boolean;
		rule_id: string;
	}[];
	room: {
		actions: string[];
		default: boolean;
		enabled: boolean;
		rule_id: string;
	}[];
	sender: [];
}

export interface AuthResponse_ {
	statusCode: number;
	body: {
		session: string;
		flows: { stages: string[] }[];
	};
}

export interface EmailTokenResponse_ {
	submit_url: string;
	sid: string; // session ID
}

export interface ErrorResponse_ {
	statusCode: number;
	statusText?: string;
	body: {
		errcode?: string;
		error?: string;
	};
}

export interface ErrorRegisterResponse_ {
	statusCode: number;
	body: {
		errcode: string;
		error: string;
		session: string;
		params: {
			'm.login.recaptcha': { public_key: string };
		};
		flows: {
			stages: string[];
		}[];
		completed: string[];
	};
}

export interface NewRoomOptions_ {
	preset?: 'private_chat' | 'public_chat';
	invite?: string[];
	is_direct?: boolean;
	name?: string;
	visibility?: 'public';
	room_alias_name?: string;
	topic?: string;
	invite_3pid?: string[];
	initial_state?: {
		type: 'm.room.join_rules' | 'm.room.history_visibility' | 'm.room.guest_access';
		state_key: string;
		content: {
			join_rule?: 'public' | 'invite';
			history_visibility?: 'invited' | 'world_readable';
			guest_access?: 'forbidden';
		};
	}[];
	power_level_content_override?: {
		events: {
			'org.matrix.msc3401.call': number;
			'org.matrix.msc3401.call.member': number;
		};
	};
	creation_content?: { _is_notepad: boolean };
}

export interface PublicRoom_ {
	room_id: string;
	aliases: string[];
	avatar_url: string;
	canonical_alias: string;
	name: string;
	topic: string;
	guest_can_join: boolean;
	world_readable: boolean;
	num_joined_members: number;
}

export interface GetPublicRoomsResponse_ {
	chunk: PublicRoom_[];
}

export interface StateEventContent_ {
	name?: string;
	url?: string;
	size?: number;
	mimetype?: string;
}

export interface GetJoinedMembersResponse_ {
	joined: {
		[id: string]: {
			display_name: string;
			avatar_url: string;
		};
	};
}

export interface GetRoomMembersResponse_ {
	chunk: {
		state_key: string;
		sender: string;
		user_id: string;
		room_id: string;
		type: string;
		content: {
			displayname: string;
			avatar_url: string;
			membership: RoomPhase;
		};
	}[];
}

export interface EventsFilter_ {
	types: ClientEventType[];
	lazy_load_members?: boolean;
	limit?: number;
}

export interface RoomFilter_ {
	timeline: EventsFilter_;
	state: EventsFilter_;
	ephemeral: EventsFilter_;
	account_data: EventsFilter_;
	include_leave: boolean;
}

export interface SyncFilter_ {
	room: RoomFilter_;
	account_data: EventsFilter_;
	presence: EventsFilter_;
}

export interface RoomSummary_ {
	'm.joined_member_count': number;
	'm.invited_member_count': number;
	'm.heroes': string[];
}

export interface RoomTimeline_ {
	events: ClientEvent_[];
	limited: boolean;
	prev_batch: string;
}

export interface DirectorySearch_ {
	limited: boolean;
	results: {
		user_id: string;
		display_name: string;
		avatar_url: string;
	}[];
}

export interface WellKnown_ {
	'm.homeserver': {
		base_url: string;
	};
	'chat.quadrix.elementcall': {
		preferredDomain: string;
	};
}

export interface SendStateEvent_ {
	event_id: string;
}

export interface EphemeralEvent_ {
	events: {
		type: EphemeralEventType;
		content: {
			[id: string]: {
				'm.read': {
					[id: string]: {
						ts: number;
					};
				};
			};
		};
	}[];
}

export interface RoomData_ {
	state: {
		events: ClientEvent_[];
	};
	invite_state: {
		events: ClientEvent_[];
	};
	summary: RoomSummary_;
	ephemeral: EphemeralEvent_;
	timeline: RoomTimeline_;
	unread_notifications: {
		notification_count: number;
	};
}

export interface SyncResponse_ {
	next_batch?: string;
	account_data?: {
		events: {
			type: ClientEventType;
			content: { [id: string]: string[] };
		}[];
	};
	rooms?: {
		invite: { [id: string]: RoomData_ };
		join: { [id: string]: RoomData_ };
		leave: { [id: string]: RoomData_ };
	};
	presence?: {
		events: ClientEvent_[];
	};
}

export interface IQueryKeysRequest {
	device_keys: { [userId: string]: string[] };
	timeout?: number;
	token?: string;
}

export interface ISignatures {
	[entity: string]: {
		[keyId: string]: string;
	};
}

export interface IDeviceKeys {
	algorithms: Array<string>;
	device_id: string;
	user_id: string;
	keys: Record<string, string>;
	signatures?: ISignatures;
}

export interface DeviceKeys {
	[deviceId: string]: IDeviceKeys & {
		unsigned?: {
			device_display_name: string;
		};
	};
}

export interface Keys {
	keys: { [keyId: string]: string };
	usage: string[];
	user_id: string;
}

export interface SigningKeys extends Keys {
	signatures: ISignatures;
}

export interface IDownloadKeyResult {
	failures: { [serverName: string]: object };
	device_keys: { [userId: string]: DeviceKeys };
	master_keys?: { [userId: string]: Keys };
	self_signing_keys?: { [userId: string]: SigningKeys };
	user_signing_keys?: { [userId: string]: SigningKeys };
}
