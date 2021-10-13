import { HostComponent, requireNativeComponent, ViewProps, ViewStyle } from 'react-native';

export interface JitsiMeetOptions {
    room: string,
    serverUrl: string,
    userInfo: {
        displayName: string,
        email?: string,
        avatar?: string,
    },
    featureFlags: { [flag: string]: boolean | number }
}

interface JitsiMeetViewProps extends ViewProps {
    style: ViewStyle,
    options: JitsiMeetOptions,
    onConferenceTerminated: () => void,
    onConferenceJoined: () => void,
    onClick?: (event: UIEvent) => void,
}

class JitsiMeet {
    public View: HostComponent<JitsiMeetViewProps> = requireNativeComponent('RCTJitsiMeetView'); // RCTJitsiMeetViewManager on native side
}

export default new JitsiMeet();
