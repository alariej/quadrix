import { HostComponent, NativeModules, requireNativeComponent, ViewProps } from 'react-native';
import { NativeComponentType } from 'react-native/Libraries/Utilities/codegenNativeComponent';

const { RNJitsiMeetView } = NativeModules;

interface JitsiMeetViewProps extends ViewProps {
	onConferenceTerminated: () => void;
	onConferenceJoined: () => void;
}

interface RNJitsiMeetViewInterface {
	call(url: string, userInfo: { displayName: string }, featureFlags: { [flag: string]: boolean | number }): void;
}

class JitsiMeet {
	public View: HostComponent<JitsiMeetViewProps> = requireNativeComponent('RNJitsiMeetView') as NativeComponentType<JitsiMeetViewProps>;

	public call(url: string, userInfo: { displayName: string }, featureFlags: { [flag: string]: boolean | number }) {
		const RNJitsiMeetView_ = RNJitsiMeetView as RNJitsiMeetViewInterface;

		return RNJitsiMeetView_.call(url, userInfo, featureFlags);
	}
}

export default new JitsiMeet();
