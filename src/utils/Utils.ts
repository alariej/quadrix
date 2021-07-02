import { PREFIX_DOWNLOAD } from '../appconfig';
import { MessageEvent } from '../models/MessageEvent';
import { hasCreatedTheRoom, hasJoinedTheRoom, hasLeftTheRoom, hasDeclinedTheInvitation, hasInvitedToRoom, hasRenamedTheRoom,
    hasChangedAvatar } from '../translations';
import UiStore from '../stores/UiStore';
import * as linkify from 'linkifyjs';
import ApiClient from '../matrix/ApiClient';
import { LinkPreview_, MessageEvent_, RoomType } from '../models/MatrixApi';
import { LinkifyElement } from '../models/LinkifyElement';

class Utils {

    public mxcToHttp(mxcUrl: string, server: string): string {

        if (!mxcUrl || typeof(mxcUrl) !== 'string') { return ''; }

        const http = mxcUrl.replace('mxc://', 'https://' + server + PREFIX_DOWNLOAD);
        return http;
    }

    public filterEvent(event: MessageEvent_, roomType: RoomType): boolean {

        if (!event) { return false; }

        return (
            Boolean(
                // (event.type === 'm.room.message' && event.content.body)
                event.type === 'm.room.message'
                || event.type === 'm.room.encrypted'
                || event.type === 'm.room.third_party_invite'
                || (event.type === 'm.room.member' && roomType !== 'community')
                || (event.type === 'm.room.name' && event.unsigned && event.unsigned.prev_content && roomType !== 'notepad')
                || (event.type === 'm.room.avatar' && event.unsigned && event.unsigned.prev_content && roomType !== 'notepad')
            )
                && !(
                    event.type === 'm.room.member'
                    && (
                        event.unsigned && event.unsigned.prev_content
                        && (event.unsigned.prev_content.membership === event.content.membership)
                    )
                )
        )
    }

    public filterRoomEvents(timelineEvents: MessageEvent_[], roomType: RoomType, previousEventTime?: number): MessageEvent[] {

        if (!timelineEvents) { return []; }

        let lastMessageDate: Date;

        if (previousEventTime) {
            lastMessageDate = new Date(previousEventTime);
            lastMessageDate.setHours(0, 0, 0, 0);
        } else {
            lastMessageDate = new Date(); // today
            lastMessageDate.setDate(lastMessageDate.getDate() + 1); // tomorrow
        }

        let lastEvent = {
            event_id: '',
        };

        return timelineEvents
            .filter(event => {
                const valid_1 = this.filterEvent(event, roomType);
                // simplistic duplicate check
                const valid_2 = (event.event_id !== lastEvent.event_id);
                lastEvent = event;
                return valid_1 && valid_2;
            })
            .map((event) => {

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
                    isRedacted: event._redacted || Object.keys(event.content).length === 0,
                };
            });
    }

    public getSystemMessage(event: MessageEvent, roomType: RoomType) {

        let systemMessage = '';
        const language = UiStore.getLanguage();

        if (event.type === 'm.room.member') {
            if (
                event.content.membership &&
                event.content.membership === 'join' &&
                !event.previousContent
            ) {
                systemMessage = event.senderId + hasCreatedTheRoom[language + '_' + roomType.substr(0, 2)];

            } else if (
                event.content.membership &&
                event.content.membership === 'join' &&
                event.previousContent &&
                event.previousContent.membership === 'invite'
            ) {
                systemMessage = event.senderId + hasJoinedTheRoom[language + '_' + roomType.substr(0, 2)];

            } else if (
                event.content.membership &&
                event.content.membership === 'leave' &&
                event.previousContent &&
                event.previousContent.membership === 'join'
            ) {
                systemMessage = event.senderId + hasLeftTheRoom[language + '_' + roomType.substr(0, 2)];

            } else if (
                event.content.membership &&
                event.content.membership === 'leave' &&
                event.previousContent &&
                event.previousContent.membership === 'invite'
            ) {
                systemMessage = event.senderId + hasDeclinedTheInvitation[language];

            } else if (
                event.content.membership &&
                event.content.membership === 'invite' &&
                (!event.previousContent || (event.previousContent.membership && event.previousContent.membership === 'leave'))
            ) {
                systemMessage = event.senderId + hasInvitedToRoom(event.userId!, language + '_' + roomType.substr(0, 2));
            }
        } else if (event.type === 'm.room.name') {

            systemMessage = event.senderId + hasRenamedTheRoom[language + '_' + roomType.substr(0, 2)];

        } else if (event.type === 'm.room.avatar') {

            systemMessage = event.senderId + hasChangedAvatar[language + '_' + roomType.substr(0, 2)];
        }

        return systemMessage;
    }

    public getRandomString(length: number): string {

        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let s = '';
        for (let i = 0; i < length; i++) {
            const n = Math.floor(Math.random() * chars.length);
            s += chars.substring(n, n + 1);
        }

        return s;
    }

    public getOnlyUrl(textInput: string): LinkifyElement | undefined {

        const linkifyArray: LinkifyElement[] = linkify.find(textInput); // eslint-disable-line

        if (linkifyArray.length === 1 && linkifyArray[0].type === 'url' && linkifyArray[0].value.length === textInput.length) {
            return linkifyArray[0];
        } else {
            return;
        }
    }

    public async getLinkPreview(linkifyElement: LinkifyElement): Promise<LinkPreview_ | undefined> {

        let previewData: LinkPreview_ | undefined;

        const previewUrl = await ApiClient.getPreviewUrl(linkifyElement.href).catch(_error => null);

        if (previewUrl) {

            previewData = {
                url: linkifyElement.href,
                text: linkifyElement.value,
                image_url: this.mxcToHttp(previewUrl['og:image'], ApiClient.credentials.homeServer),
                image_width: previewUrl['og:image:width'] || 0,
                image_height: previewUrl['og:image:height'] || 0,
                title: previewUrl['og:title'] || linkifyElement.value,
                site_name: previewUrl['og:site_name'] || linkifyElement.value,
            }
        } else {

            previewData = undefined
        }

        return Promise.resolve(previewData);
    }
}
export default new Utils();
