import {
	hasCreatedTheRoom,
	hasJoinedTheRoom,
	hasLeftTheRoom,
	hasDeclinedTheInvitation,
	hasInvitedToRoom,
	hasRenamedTheRoom,
	hasChangedAvatar,
	lauchedVideoConference,
	leftVideoConference,
	joinedVideoConference,
} from '../translations';
import UiStore from '../stores/UiStore';
import {
	ClientEvent_,
	MemberEventContent_,
	RoomType,
	CallMemberEventContent_,
} from '../models/MatrixApi';
import { FilteredChatEvent } from '../models/FilteredChatEvent';
import { Msc3401Call, Msc3401CallStatus } from '../models/Msc3401Call';
import differenceInHours from 'date-fns/differenceInHours';

class EventUtils {
	public filterEvent(event: ClientEvent_, roomType: RoomType): boolean {
		if (!event) {
			return false;
		}

		const content = event.content as MemberEventContent_;
		const prevContent = event.unsigned?.prev_content as MemberEventContent_;

		return (
			Boolean(
				event.type === 'm.room.message' ||
					event.type === 'm.room.redaction' ||
					event.type === 'm.room.encrypted' ||
					event.type === 'm.room.third_party_invite' ||
					event.type === 'org.matrix.msc3401.call' ||
					event.type === 'org.matrix.msc3401.call.member' ||
					(event.type === 'm.room.member' && roomType !== 'community') ||
					(event.type === 'm.room.name' &&
						event.unsigned &&
						event.unsigned.prev_content &&
						roomType !== 'notepad') ||
					(event.type === 'm.room.avatar' &&
						event.unsigned &&
						event.unsigned.prev_content &&
						roomType !== 'notepad')
			) &&
			!(
				event.type === 'm.room.member' &&
				event.unsigned &&
				prevContent &&
				prevContent.membership === content.membership
			)
		);
	}

	public filterRoomEvents(
		timelineEvents: ClientEvent_[],
		roomType: RoomType,
		previousEventTime?: number
	): FilteredChatEvent[] {
		if (!timelineEvents) {
			return [];
		}

		let lastMessageDate: Date;

		if (previousEventTime) {
			lastMessageDate = new Date(previousEventTime);
			lastMessageDate.setHours(0, 0, 0, 0);
		} else {
			lastMessageDate = new Date(); // today
			lastMessageDate.setDate(lastMessageDate.getDate() + 1); // tomorrow
		}

		const timelineEvents_ = timelineEvents
			.filter(event => {
				return this.filterEvent(event, roomType);
			})
			.map(event => {
				const thisMessageDate = new Date(event.origin_server_ts);
				thisMessageDate.setHours(0, 0, 0, 0);
				const dateChangeFlag: boolean = thisMessageDate < lastMessageDate;
				lastMessageDate = thisMessageDate;

				return {
					eventId: event.event_id,
					content: event.content,
					type: event.type,
					time: event.origin_server_ts,
					senderId: event.sender,
					previousContent: event.unsigned ? event.unsigned.prev_content : undefined,
					userId: event.state_key,
					dateChangeFlag: dateChangeFlag,
					tempId: event.unsigned ? event.unsigned.transaction_id : undefined,
					redacts: event.redacts,
					isRedacted: Object.keys(event.content).length === 0,
					isEdited: Boolean(event.unsigned?.['m.relations']?.['m.replace']),
				};
			});

		return timelineEvents_;
	}

	public getSystemMessage(event: FilteredChatEvent, roomType: RoomType) {
		let systemMessage = '';
		const language = UiStore.getLanguage();

		if (event.type === 'm.room.member') {
			const content = event.content as MemberEventContent_;
			const prevContent = event.previousContent as MemberEventContent_;
			if (content.membership && content.membership === 'join' && !event.previousContent) {
				systemMessage = event.senderId + hasCreatedTheRoom[language + '_' + roomType.substr(0, 2)];
			} else if (
				content.membership &&
				content.membership === 'join' &&
				prevContent &&
				prevContent.membership === 'invite'
			) {
				systemMessage = event.senderId + hasJoinedTheRoom[language + '_' + roomType.substr(0, 2)];
			} else if (
				content.membership &&
				content.membership === 'leave' &&
				prevContent &&
				prevContent.membership === 'join'
			) {
				systemMessage = event.senderId + hasLeftTheRoom[language + '_' + roomType.substr(0, 2)];
			} else if (
				content.membership &&
				content.membership === 'leave' &&
				prevContent &&
				prevContent.membership === 'invite'
			) {
				systemMessage = event.senderId + hasDeclinedTheInvitation[language];
			} else if (
				content.membership &&
				content.membership === 'invite' &&
				(!event.previousContent || (prevContent.membership && prevContent.membership === 'leave'))
			) {
				systemMessage =
					event.senderId + hasInvitedToRoom(event.userId!, language + '_' + roomType.substr(0, 2));
			}
		} else if (event.type === 'm.room.name') {
			systemMessage = event.senderId + hasRenamedTheRoom[language + '_' + roomType.substr(0, 2)];
		} else if (event.type === 'm.room.avatar') {
			systemMessage = event.senderId + hasChangedAvatar[language + '_' + roomType.substr(0, 2)];
		} else if (event.type === 'org.matrix.msc3401.call') {
			systemMessage = event.senderId + ' ' + lauchedVideoConference[language];
		} else if (event.type === 'org.matrix.msc3401.call.member') {
			const content = event.content as CallMemberEventContent_;
			if (content['m.calls'].length === 0) {
				systemMessage = event.senderId + ' ' + leftVideoConference[language];
			} else {
				systemMessage = event.senderId + ' ' + joinedVideoConference[language];
			}
		}

		return systemMessage;
	}

	public getMsc3401CallStatus(msc3401Call: Msc3401Call, userId: string): Msc3401CallStatus {
		if (msc3401Call?.participants && differenceInHours(Date.now(), msc3401Call.startTime!) < 12) {
			const activeParticipants = Object.entries(msc3401Call?.participants).filter(
				participant => participant[1] === true
			);
			if (activeParticipants?.length > 0) {
				if (msc3401Call.participants[userId]) {
					return 'joined';
				} else {
					return 'ringing';
				}
			}
		}
		return 'none';
	}
}

export default new EventUtils();
