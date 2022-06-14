import { MessageEvent } from '../../models/MessageEvent';

class ShareHandlerIncoming {
	public launchedFromSharedContent(_sharedContent: string, _shareContent: (event: { url: string }) => void): void {
		// do nothing in web / desktop
	}

	public addListener(_shareContent: (event: { url: string }) => void): void {
		// do nothing in web / desktop
	}

	public removeListener(_shareContent: (event: { url: string }) => void): void {
		// do nothing in web / desktop
	}

	public shareContent(
		_sharedContent_: string,
		_showTempForwardedMessage: (roomId: string, message: MessageEvent, tempId: string) => void
	): void {
		// do nothing in web / desktop
	}
}

export default new ShareHandlerIncoming();
