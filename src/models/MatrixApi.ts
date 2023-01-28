// move this somewhere else
export type RoomType = 'direct' | 'group' | 'community' | 'notepad';

export type RoomPhase = 'join' | 'invite' | 'leave';
export type LoginIdentifierType = 'm.id.user' | 'm.id.thirdparty' | 'm.id.phone';
export type LoginParamType = 'm.login.password' | 'm.login.token';
export type RegisterStageType = 'm.login.recaptcha' | 'm.login.terms' | 'm.login.dummy' | 'm.login.email.identity';
export type StateEventType = 'm.room.avatar' | 'm.room.name';
export type MessageEventType =
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
	| 'm.receipt'
	| 'm.direct'
	| 'm.push_rules'
	| 'm.presence';

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

export interface MessageEvent_ {
	event_id: string;
	content: MessageEventContent_;
	type: MessageEventType;
	origin_server_ts: number;
	sender: string;
	state_key?: string;
	unsigned?: {
		age?: number;
		prev_content?: MessageEventContent_;
		transaction_id?: string;
		membership?: RoomPhase;
		'm.relations'?: {
			'm.replace'?: {
				event_id?: string;
				origin_server_ts?: number;
				sender?: string;
			};
		};
	};
	redacts?: string;
}

export interface ThumbnailInfo_ {
	mimetype: string;
	size: number;
	h: number;
	w: number;
}

export interface MessageEventContentInfo_ {
	mimetype?: string;
	size?: number;
	h?: number;
	w?: number;
	thumbnail_url?: string;
	thumbnail_info?: ThumbnailInfo_;
}

export interface MessageEventContent_ {
	msgtype?: string;
	body?: string;
	info?: MessageEventContentInfo_;
	url?: string;
	membership?: RoomPhase;
	'm.new_content'?: {
		body?: string;
		msgtype?: string;
		_time?: number; // custom field
	};
	'm.relates_to'?: {
		event_id?: string;
		is_falling_back?: boolean;
		rel_type?: string;
		'm.in_reply_to'?: { [event_id: string]: string };
	};
	name?: string;
	alias?: string;
	join_rule?: string;
	topic?: string;

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
}

export type CallEventContent_ = IGroupCallRoomState;

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
	creation_content?: { is_notepad: boolean };
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
	types: MessageEventType[];
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
	events: MessageEvent_[];
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
		events: MessageEvent_[];
	};
	invite_state: {
		events: MessageEvent_[];
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
			type: MessageEventType;
			content: { [id: string]: string[] };
		}[];
	};
	rooms?: {
		invite: { [id: string]: RoomData_ };
		join: { [id: string]: RoomData_ };
		leave: { [id: string]: RoomData_ };
	};
	presence?: {
		events: MessageEvent_[];
	};
}
