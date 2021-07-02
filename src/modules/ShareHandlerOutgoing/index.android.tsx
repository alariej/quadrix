import Share from 'react-native-share';
import { MessageEvent } from '../../models/MessageEvent';
import RNFetchBlob from 'rn-fetch-blob'
import utils from '../../utils/Utils';
import ApiClient from '../../matrix/ApiClient';
import { shareWith } from '../../translations';
import UiStore from '../../stores/UiStore';

class ShareHandlerOutgoing {

    public async shareContent(message: MessageEvent, onSuccess: (success: boolean) => void): Promise<void> {

        let options;
        let filePath: string;

        if (message.content.msgtype === 'm.text') {

            onSuccess(true);

            options = {
                title: shareWith[UiStore.getLanguage()],
                message: message.content.body,
            }

            await Share.open(options).catch(_error => null);

        } else {

            const url = utils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);
            const fileName = message.content.body;
            const mimeType = message.content.info!.mimetype;

            RNFetchBlob.config({
                overwrite: true,
                path: RNFetchBlob.fs.dirs.CacheDir + '/' + fileName,
            })
                .fetch('GET', url, { 'Content-Type' : 'octet-stream' })
                .then(response => {

                    filePath = response.path();

                    return response.readFile('base64');
                })
                .then(async base64Data => {

                    onSuccess(true);

                    options = {
                        title: shareWith[UiStore.getLanguage()],
                        url: 'data:' + mimeType + ';base64,' + base64Data,
                        failOnCancel: false,
                    };

                    await Share.open(options).catch(_error => null);

                    await RNFetchBlob.fs.unlink(filePath).catch(_error => null);
                })
                .catch((_error) => {
                    onSuccess(false);
                });
        }
    }
}

export default new ShareHandlerOutgoing();
