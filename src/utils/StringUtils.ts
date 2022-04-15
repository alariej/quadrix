import * as linkify from 'linkifyjs';
import ApiClient from '../matrix/ApiClient';
import { LinkPreview_ } from '../models/MatrixApi';
import { LinkifyElement } from '../models/LinkifyElement';
import { PREFIX_DOWNLOAD } from '../appconfig';
import { MessageEvent } from '../models/MessageEvent';

class StringUtils {

    public mxcToHttp(mxcUrl: string, server: string): string {

        if (!mxcUrl || typeof(mxcUrl) !== 'string') { return ''; }

        const http = mxcUrl.replace('mxc://', 'https://' + server + PREFIX_DOWNLOAD);
        return http;
    }

    public getCachedFileName(message: MessageEvent, server: string): string {
        return message.content.url?.replace('mxc://' + server + '/', '') + '_' + message.content.body;
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

        if (!body) { return '' }

        return body.replace(/^>\s(.*)$[\r\n]+/mg, '');
    }

    public flattenString = (text: string): string => {

        if (!text) { return '' }

        return text.replace(/[\r\n]/mg, '  ');
    }

    public getReplyFallback = (body: string): { senderName: string, message: string } => {

        if (!body) { return { senderName: 'N/A', message: 'N/A' } }

        const senderName = (body.match(/<.*>/g) || '')[0].replace(/<|>/g, '');
        const message = body.replace(/<.*>\s/g, '').match(/(^>\s)(.*)/mg)?.join('  ').replace(/>\s/g, '');

        return { senderName: senderName || 'N/A', message: message || 'N/A' };
    }

    public cleanServerName = (serverName: string): string => {

        return serverName.replace(/^https?:\/\//g, '');
    }
}

export default new StringUtils();
