import { HostComponent, NativeModules, requireNativeComponent, ViewProps, ViewStyle } from 'react-native';

const { RNJitsiMeetView } = NativeModules;

interface JMViewProps extends ViewProps {
    style: ViewStyle,
    onConferenceTerminated: () => void,
    onConferenceJoined: () => void,
}

interface RNJitsiMeetViewInterface {
    call(
        url: string,
        userInfo: { displayName: string },
        featureFlags: { [flag: string]: boolean | number }
    ): void
}

class JitsiMeet {

    public View: HostComponent<JMViewProps> = requireNativeComponent('RNJitsiMeetView');

    public call(
        url: string,
        userInfo: { displayName: string },
        featureFlags: { [flag: string]: boolean | number }
    ) {

        const RNJitsiMeetView_ = RNJitsiMeetView as RNJitsiMeetViewInterface;

        return RNJitsiMeetView_.call(url, userInfo, featureFlags);
    }
}

export default new JitsiMeet();
