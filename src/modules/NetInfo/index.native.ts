import * as RNNetInfo from '@react-native-community/netinfo';
import SubscribableEvent from 'subscribableevent';

export class NetInfo {
	public connectivityChangedEvent = new SubscribableEvent<(isConnected: boolean) => void>();

	constructor() {
		const onEventOccurredHandler = (state: RNNetInfo.NetInfoState) => {
			this.connectivityChangedEvent.fire(state.isConnected!);
		};

		RNNetInfo.addEventListener(onEventOccurredHandler);
	}

	isConnected(): Promise<boolean> {
		return RNNetInfo.fetch()
			.then((state: RNNetInfo.NetInfoState) => Promise.resolve(state.isConnected!))
			.catch(() => Promise.reject('NetInfo.isConnected.fetch() failed'));
	}
}

export default new NetInfo();
