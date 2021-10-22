import { EmitterSubscription, NativeEventEmitter, NativeModule, NativeModules, StatusBar } from 'react-native';

class ScreenOrientation {

    private orientationEmitter: NativeEventEmitter;
    private orientationListener!: EmitterSubscription;

    constructor() {

        const { Orientation } = NativeModules;
        this.orientationEmitter = new NativeEventEmitter(Orientation as NativeModule);
    }

    public addListener(onChangedOrientation: (orientation: string) => void) {

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
