import React from 'react';
import RX from 'reactxp';
import DialogRoomPicker from '../../dialogs/DialogRoomPicker';
import DialogIncomingContentShare from '../../dialogs/DialogIncomingContentShare';
import { EmitterSubscription, Linking } from 'react-native';
import { sendTo } from '../../translations';
import UiStore from '../../stores/UiStore';
import { SharedContent } from '../../models/SharedContent';
import { FilteredChatEvent } from '../../models/FilteredChatEvent';

class ShareHandlerIncoming {
	private linkingListener: EmitterSubscription | undefined;

	public async launchedFromSharedContent(
		_sharedContent: string,
		shareContent: (event: { url: string }) => void
	): Promise<void> {
		const url = await Linking.getInitialURL();

		if (url) {
			shareContent({ url: url });
		}
	}

	public addListener(shareContent: (event: { url: string }) => void): void {
		this.linkingListener = Linking.addEventListener('url', shareContent);
	}

	public removeListener(): void {
		this.linkingListener?.remove();
	}

	public shareContent(
		sharedContent_: string,
		showTempForwardedMessage: (roomId: string, message: FilteredChatEvent, tempId: string) => void
	): void {
		const contentSeparator = '://sharedContent=';
		const n = sharedContent_.indexOf(contentSeparator) + contentSeparator.length;
		const sharedContentEncoded = sharedContent_.substr(n);
		const sharedContentDecoded = decodeURI(sharedContentEncoded);
		const sharedContent = JSON.parse(sharedContentDecoded) as SharedContent[];

		RX.Modal.dismissAll();

		/* 
        TODO: problem when sharing URLs from Firefox on iOS
        Firefox sends 2 ojects, with the second one containing the URL
        Other browsers (safari, chrome, ddg) or apps only send one object
        Therefore we use here [m - 1], the last object in the list, and not [0]
        */

		const m = sharedContent.length;

		// does not support multi-item-sharing yet
		const dialogRoomPicker = (
			<DialogRoomPicker
				onPressRoom={roomId => this.askSendContent(roomId, sharedContent[m - 1], showTempForwardedMessage)}
				label={sendTo[UiStore.getLanguage()] + '...'}
			/>
		);

		RX.Modal.show(dialogRoomPicker, 'DialogRoomPicker');
	}

	private askSendContent(
		roomId: string,
		sharedContent: SharedContent,
		showTempForwardedMessage: (roomId: string, message: FilteredChatEvent, tempId: string) => void
	): void {
		RX.Modal.dismiss('DialogRoomPicker');

		const dialogIncomingContentShare = (
			<DialogIncomingContentShare
				roomId={roomId}
				sharedContent={sharedContent}
				showTempForwardedMessage={showTempForwardedMessage}
			/>
		);

		RX.Modal.show(dialogIncomingContentShare, 'dialogIncomingContentShare');
	}
}

export default new ShareHandlerIncoming();
