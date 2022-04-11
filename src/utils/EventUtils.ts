import { PREFIX_DOWNLOAD } from '../appconfig';
import { MessageEvent } from '../models/MessageEvent';
import { hasCreatedTheRoom, hasJoinedTheRoom, hasLeftTheRoom, hasDeclinedTheInvitation, hasInvitedToRoom, hasRenamedTheRoom,
    hasChangedAvatar } from '../translations';
import UiStore from '../stores/UiStore';
import * as linkify from 'linkifyjs';
import ApiClient from '../matrix/ApiClient';
import { LinkPreview_, MessageEvent_, RoomType } from '../models/MatrixApi';
import { LinkifyElement } from '../models/LinkifyElement';

class EventUtils {

    public mxcToHttp(mxcUrl: string, server: string): string {

        if (!mxcUrl || typeof(mxcUrl) !== 'string') { return ''; }

        const http = mxcUrl.replace('mxc://', 'https://' + server + PREFIX_DOWNLOAD);
        return http;
    }

    public getCachedFileName(message: MessageEvent, server: string): string {
        return message.content.url?.replace('mxc://' + server + '/', '') + '_' + message.content.body;
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

        const linkifyArray: LinkifyElement[] = linkify.find(textInput);

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

    public isAllEmojis(body: string) {
        const emojis = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g; // eslint-disable-line
        return body.replace(emojis, '').length === 0;
    }

    public parseUserId(userId: string): { user: string, server: string } {

        let user = '';
        let server = '';

        const a = userId.indexOf('@');
        const b = userId.lastIndexOf(':');

        if (a > -1 && b > 0) {
            user = userId.substr(a + 1, b - a - 1);
            server = userId.substr(b - a + 1).trim();
        } else if (a > -1 && b === -1) {
            user = userId.substr(0, a);
            server = userId.substr(a + 1).trim();
        } else if (a === -1 && b > 0) {
            user = userId.substr(0, b);
            server = userId.substr(b + 1).trim();
        }

        return { user: user, server: server }
    }

    public messageMediaType(fileType: string): string {

        if (fileType.includes('image')) {
            return 'm.image';
        } else if (fileType.includes('video')) {
            return 'm.video';
        } else {
            return 'm.file';
        }
    }

    public stripReplyMessage = (body: string): string => {
        return body.replace(/^>\s(.*)$[\r\n]+/mg, '');
    }

    public flattenString = (text: string): string => {
        return text.replace(/[\r\n]/mg, '  ');
    }
}

export default new EventUtils();
