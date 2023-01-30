import { FilteredChatEvent } from '../../models/FilteredChatEvent';

class ShareHandlerOutgoing {
	public shareContent(_event: FilteredChatEvent, _onSuccess: (success: boolean) => void): void {
		// do nothing
	}
}

export default new ShareHandlerOutgoing();
