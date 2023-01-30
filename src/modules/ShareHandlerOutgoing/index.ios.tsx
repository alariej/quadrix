import Share from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
import ApiClient from '../../matrix/ApiClient';
import { shareWith } from '../../translations';
import UiStore from '../../stores/UiStore';
import StringUtils from '../../utils/StringUtils';
import { FilteredChatEvent } from '../../models/FilteredChatEvent';
import { MessageEventContent_ } from '../../models/MatrixApi';

class ShareHandlerOutgoing {
	public async shareContent(message: FilteredChatEvent, onSuccess: (success: boolean) => void): Promise<void> {
		let options;
		let filePath;

		const content = message.content as MessageEventContent_;

		if (content.msgtype === 'm.text') {
			onSuccess(true);

			options = {
				title: shareWith[UiStore.getLanguage()],
				message: content.body,
			};

			await Share.open(options).catch(_error => null);
		} else {
			const url = StringUtils.mxcToHttp(content.url!, ApiClient.credentials.homeServer);
			const fileName = content.body;

			ReactNativeBlobUtil.config({
				overwrite: true,
				path: ReactNativeBlobUtil.fs.dirs.CacheDir + '/' + fileName,
			})
				.fetch('GET', url, { 'Content-Type': 'octet-stream' })
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
				.catch(_error => {
					onSuccess(false);
				});
		}
	}
}

export default new ShareHandlerOutgoing();
