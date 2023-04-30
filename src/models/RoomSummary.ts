import { FilteredChatEvent } from './FilteredChatEvent';
import { ClientEvent_, RoomPhase, RoomType } from './MatrixApi';
import { Msc3401Call } from './Msc3401Call';
import { ReadReceipt } from './ReadReceipt';
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
	readReceipts?: ReadReceipt;
	thirdPartyInviteId?: string;
	topic?: string;
	newEventsLimited?: boolean;
	latestFilteredEvent?: FilteredChatEvent;
	msc3401Call?: Msc3401Call;
	msc3401Ready?: boolean;
}
