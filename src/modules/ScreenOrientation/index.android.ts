import { NativeEventEmitter, NativeModules, StatusBar } from 'react-native';

class ScreenOrientation {

    public addListener(onChangedOrientation: (oritentation: string) => void) {

        const { Orientation } = NativeModules;
        Orientation.start(); // eslint-disable-line

        const eventEmitter = new NativeEventEmitter(Orientation);
        eventEmitter.addListener('orientationChanged', onChangedOrientation);
    }

    public removeListener(onChangedOrientation: (oritentation: string) => void) {

        const { Orientation } = NativeModules;
        Orientation.stop(); // eslint-disable-line

        const eventEmitter = new NativeEventEmitter(Orientation);
        eventEmitter.removeListener('orientationChanged', onChangedOrientation);
    }

    public hideStatusBar(hidden: boolean) {
        /*
        const { Orientation } = NativeModules;
        hidden ? Orientation.fullscreenOn() : Orientation.fullscreenOff(); // eslint-disable-line
        */
        StatusBar.setHidden(hidden, 'fade');
    }
}

export default new ScreenOrientation();
