import SubscribableEvent from 'subscribableevent';

export class NetInfo {
	public connectivityChangedEvent = new SubscribableEvent<(isConnected: boolean) => void>();

	constructor() {
		const onEventOccuredHandler = () => {
			this.connectivityChangedEvent.fire(navigator.onLine);
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('online', onEventOccuredHandler);
			window.addEventListener('offline', onEventOccuredHandler);
		}
	}

	isConnected(): Promise<boolean> {
		return Promise.resolve(navigator.onLine);
	}
}

export default new NetInfo();
