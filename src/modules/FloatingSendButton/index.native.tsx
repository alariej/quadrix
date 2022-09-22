import RX from 'reactxp';
import React, { Component } from 'react';
import AnimatedButton from '../../components/AnimatedButton';
import { SvgFile } from '../../components/IconSvg';
import { BUTTON_FILL, BUTTON_HEIGHT } from '../../ui';
import { EmitterSubscription, Keyboard } from 'react-native';
import { hasNotch } from 'react-native-device-info';
import UiStore from '../../stores/UiStore';

interface FloatingSendButtonProps {
	offline: boolean;
	onPressSendButton: (() => void) | undefined;
}

interface FloatingSendButtonState {
	keyboardHeight: number;
}

export default class FloatingSendButton extends Component<FloatingSendButtonProps, FloatingSendButtonState> {
	private showSubscription: EmitterSubscription;
	private hideSubscription: EmitterSubscription;
	private isAndroid: boolean;

	constructor(props: FloatingSendButtonProps) {
		super(props);

		this.isAndroid = UiStore.getPlatform() === 'android';
		const hideListener = this.isAndroid ? 'keyboardDidHide' : 'keyboardWillHide';

		this.showSubscription = Keyboard.addListener('keyboardDidShow', e =>
			this.setKeyboardHeight(e.endCoordinates.height)
		);
		this.hideSubscription = Keyboard.addListener(hideListener, () => this.setKeyboardHeight(0));

		this.state = {
			keyboardHeight: 0,
		};
	}

	public componentWillUnmount(): void {
		this.showSubscription.remove();
		this.hideSubscription.remove();
	}

	private setKeyboardHeight = (height: number) => {
		this.setState({ keyboardHeight: height });
	};

	public render(): JSX.Element | null {
		if (!this.props.onPressSendButton || !this.state.keyboardHeight || this.props.offline) {
			return null;
		}

		let bottom: number;
		if (this.isAndroid) {
			bottom = 12;
		} else {
			const notchHeight = hasNotch() ? 37 : 0;
			bottom = 12 + this.state.keyboardHeight - notchHeight;
		}

		return (
			<RX.View
				style={{
					position: 'absolute',
					bottom: bottom,
					right: 12,
				}}
			>
				<AnimatedButton
					buttonStyle={{
						width: 80,
						height: BUTTON_HEIGHT,
						borderRadius: BUTTON_HEIGHT / 2,
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: BUTTON_FILL,
					}}
					iconSource={require('../../resources/svg/RI_send.json') as SvgFile}
					iconFillColor={'white'}
					iconHeight={20}
					iconWidth={20}
					animatedColor={'white'}
					onPress={this.props.onPressSendButton}
				/>
			</RX.View>
		);
	}
}
