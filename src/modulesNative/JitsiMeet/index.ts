import { NativeModules } from 'react-native';

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

interface JitsiMeetInterface {
    launch(options: JitsiMeetOptions): void
}

const { JitsiMeet } = NativeModules;

class JitsiMeetModule {

    public launch(options: JitsiMeetOptions) {

        const JitsiMeet_ = JitsiMeet as JitsiMeetInterface;

        return JitsiMeet_.launch(options);
    }
}

export default new JitsiMeetModule();
