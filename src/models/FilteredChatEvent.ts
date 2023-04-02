import {
	MessageEventContent_,
	CallEventContent_,
	MemberEventContent_,
	RoomEventContent_,
	ClientEventType,
	PresenceEventContent_,
} from './MatrixApi';

export interface FilteredChatEvent {
	eventId: string;
	type: ClientEventType;
	content: MessageEventContent_ | RoomEventContent_ | MemberEventContent_ | CallEventContent_ | PresenceEventContent_;
	time: number;
	senderId: string;
	stateKey?: string;
	previousContent?:
		| MessageEventContent_
		| RoomEventContent_
		| MemberEventContent_
		| CallEventContent_
		| PresenceEventContent_;
	dateChangeFlag?: boolean;
	tempId?: string;
	redacts?: string;
	isRedacted?: boolean;
	isEdited?: boolean;
}

// TODO: change this function's name
// to TemporaryChatEvent
export interface TemporaryMessage {
	body: string;
	senderId?: string;
	time?: number;
	tempId?: string;
}
