import Share from 'react-native-share';
import { MessageEvent } from '../../models/MessageEvent';
import ReactNativeBlobUtil from 'react-native-blob-util'
import EventUtils from '../../utils/EventUtils';
import ApiClient from '../../matrix/ApiClient';
import { shareWith } from '../../translations';
import UiStore from '../../stores/UiStore';

class ShareHandlerOutgoing {

    public async shareContent(message: MessageEvent, onSuccess: (success: boolean) => void): Promise<void> {

        let options;
        let filePath;

        if (message.content.msgtype === 'm.text') {

            onSuccess(true);

            options = {
                title: shareWith[UiStore.getLanguage()],
                message: message.content.body,
            }

            await Share.open(options).catch(_error => null);

        } else {

            const url = EventUtils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);
            const fileName = message.content.body;

            ReactNativeBlobUtil.config({
                overwrite: true,
                path: ReactNativeBlobUtil.fs.dirs.CacheDir + '/' + fileName,
            })
                .fetch('GET', url, { 'Content-Type' : 'octet-stream' })
                .then(async response => {

                    filePath = response.path();

                    onSuccess(true);

                    options = {
                        title: shareWith[UiStore.getLanguage()],
                        url: 'file://' + filePath,
                        failOnCancel: false,
                    };

                    await Share.open(options).catch(_error => null);

                    await ReactNativeBlobUtil.fs.unlink(filePath).catch(_error => null);
                })
                .catch((_error) => {
                    onSuccess(false);
                });
        }
    }
}

export default new ShareHandlerOutgoing();
