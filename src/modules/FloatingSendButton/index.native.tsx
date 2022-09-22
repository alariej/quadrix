import RX from 'reactxp';
import React, { Component } from 'react';
import AnimatedButton from '../../components/AnimatedButton';
import { SvgFile } from '../../components/IconSvg';
import { BUTTON_FILL, BUTTON_HEIGHT } from '../../ui';
import { EmitterSubscription, Keyboard } from 'react-native';
import { hasNotch } from 'react-native-device-info';

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

	constructor(props: FloatingSendButtonProps) {
		super(props);

		this.showSubscription = Keyboard.addListener('keyboardDidShow', e =>
			this.setKeyboardHeight(e.endCoordinates.height)
		);
		this.hideSubscription = Keyboard.addListener('keyboardWillHide', () => this.setKeyboardHeight(0));

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

		const notchHeight = hasNotch() ? 37 : 0;

		return (
			<RX.View
				style={{
					position: 'absolute',
					bottom: this.state.keyboardHeight + 12 - notchHeight,
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
