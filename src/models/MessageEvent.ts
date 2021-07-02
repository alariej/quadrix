import { MessageEventContent_ } from "./MatrixApi";

export interface MessageEvent {
    eventId: string,
    content: MessageEventContent_,
    type: string,
    time: number,
    senderId: string,
    userId?: string,
    previousContent?: MessageEventContent_,
    dateChangeFlag?: boolean,
    tempId?: string,
    isRedacted?: boolean;
}

export interface TemporaryMessage {
    body: string,
    senderId?: string,
    time?: number,
    tempId?: string,
}
