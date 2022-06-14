import { EmitterSubscription, NativeEventEmitter, NativeModule, NativeModules, StatusBar } from 'react-native';

interface OrientationInterface {
	start(): void;
	stop(): void;
}

class ScreenOrientation {
	private Orientation: OrientationInterface;
	private orientationEmitter: NativeEventEmitter;
	private orientationListener!: EmitterSubscription;

	constructor() {
		const { Orientation } = NativeModules;
		this.Orientation = Orientation as OrientationInterface;
		this.orientationEmitter = new NativeEventEmitter(Orientation as NativeModule);
	}

	public addListener(onChangedOrientation: (orientation: string) => void) {
		this.Orientation.start();
		this.orientationListener = this.orientationEmitter.addListener('orientationChanged', onChangedOrientation);
	}

	public removeListener() {
		this.orientationListener.remove();
	}

	public hideStatusBar(hidden: boolean) {
		StatusBar.setHidden(hidden, 'fade');
	}
}

export default new ScreenOrientation();
