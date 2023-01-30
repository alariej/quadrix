import Share from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
import ApiClient from '../../matrix/ApiClient';
import { shareWith } from '../../translations';
import UiStore from '../../stores/UiStore';
import StringUtils from '../../utils/StringUtils';
import { FilteredChatEvent } from '../../models/FilteredChatEvent';
import { FileInfo_, ImageInfo_, MessageEventContent_, VideoInfo_ } from '../../models/MatrixApi';

class ShareHandlerOutgoing {
	public async shareContent(message: FilteredChatEvent, onSuccess: (success: boolean) => void): Promise<void> {
		let options;
		let filePath: string;

		const content = message.content as MessageEventContent_;

		if (content.msgtype === 'm.text') {
			onSuccess(true);

			options = {
				title: shareWith[UiStore.getLanguage()],
				message: content.body,
			};

			await Share.open(options).catch(_error => null);
		} else {
			const info = content.info as ImageInfo_ | VideoInfo_ | FileInfo_;
			const url = StringUtils.mxcToHttp(content.url!, ApiClient.credentials.homeServer);
			const fileName = content.body;
			const mimeType = info.mimetype;

			ReactNativeBlobUtil.config({
				overwrite: true,
				path: ReactNativeBlobUtil.fs.dirs.CacheDir + '/' + fileName,
			})
				.fetch('GET', url, { 'Content-Type': 'octet-stream' })
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

					await ReactNativeBlobUtil.fs.unlink(filePath).catch(_error => null);
				})
				.catch(_error => {
					onSuccess(false);
				});
		}
	}
}

export default new ShareHandlerOutgoing();
