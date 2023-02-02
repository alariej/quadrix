import { FilteredChatEvent } from './FilteredChatEvent';
import { CallEventContent_, ClientEvent_, RoomPhase, RoomType } from './MatrixApi';
import { User } from './User';

export interface RoomSummary {
	id: string;
	phase: RoomPhase;
	unreadCount: number;
	members: { [id: string]: User };
	timelineEvents: ClientEvent_[];
	stateEvents: ClientEvent_[];
	newEvents: FilteredChatEvent[];
	active?: boolean;
	type?: RoomType;
	isEncrypted?: boolean;
	name?: string;
	joinMembersCount?: number;
	inviteMembersCount?: number;
	avatarUrl?: string;
	heroes?: string[];
	alias?: string;
	contactId?: string;
	timelineToken?: string;
	timelineLimited?: boolean;
	joinRule?: string;
	readReceipts?: { [id: string]: { eventId: string; timestamp: number } };
	thirdPartyInviteId?: string;
	topic?: string;
	newEventsLimited?: boolean;
	latestFilteredEvent?: FilteredChatEvent;
	msc3401Call?: {
		startTime?: number;
		callId?: string;
		callEventContent?: CallEventContent_;
		participants?: { [id: string]: boolean };
	};
}
