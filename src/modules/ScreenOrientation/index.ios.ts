import { NativeEventEmitter, NativeModules, StatusBar } from 'react-native';

class ScreenOrientation {

    public addListener(onChangedOrientation: (oritentation: string) => void) {

        const eventEmitter = new NativeEventEmitter(NativeModules.Orientation);
        eventEmitter.addListener('orientationChanged', onChangedOrientation);
    }

    public removeListener(onChangedOrientation: (oritentation: string) => void) {

        const eventEmitter = new NativeEventEmitter(NativeModules.Orientation);
        eventEmitter.removeListener('orientationChanged', onChangedOrientation);
    }

    public hideStatusBar(hidden: boolean) {
        StatusBar.setHidden(hidden, 'fade');
    }
}

export default new ScreenOrientation();
