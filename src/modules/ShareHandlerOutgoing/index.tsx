import { MessageEvent } from '../../models/MessageEvent';

class ShareHandlerOutgoing {
	public shareContent(_event: MessageEvent, _onSuccess: (success: boolean) => void): void {
		// do nothing
	}
}

export default new ShareHandlerOutgoing();
