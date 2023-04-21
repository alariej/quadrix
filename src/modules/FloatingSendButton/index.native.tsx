import RX from 'reactxp';
import React, { Component } from 'react';
import AnimatedButton from '../../components/AnimatedButton';
import { SvgFile } from '../../components/IconSvg';
import { BUTTON_FILL, BUTTON_HEIGHT } from '../../ui';
import { EmitterSubscription, Keyboard } from 'react-native';
import { hasNotch } from 'react-native-device-info';
import UiStore from '../../stores/UiStore';

const animatedSizeStart = 0;
const animatedDuration = 500;
const animatedEasing = RX.Animated.Easing.InOutBack();

const styles = {
	button: RX.Styles.createViewStyle({
		width: 80,
		height: BUTTON_HEIGHT,
		borderRadius: BUTTON_HEIGHT / 2,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: BUTTON_FILL,
	}),
};

interface FloatingSendButtonProps {
	offline: boolean;
	onPressSendButton: ((e: RX.Types.SyntheticEvent) => void) | undefined;
}

interface FloatingSendButtonState {
	keyboardHeight: number;
}

export default class FloatingSendButton extends Component<FloatingSendButtonProps, FloatingSendButtonState> {
	private showSubscription: EmitterSubscription;
	private hideSubscription: EmitterSubscription;
	private isAndroid: boolean;
	private animatedValue: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;

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

		this.animatedValue = RX.Animated.createValue(animatedSizeStart);
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			transform: [{ scale: this.animatedValue }],
		});
	}

	public componentWillUnmount(): void {
		this.showSubscription.remove();
		this.hideSubscription.remove();
	}

	public shouldComponentUpdate(
		nextProps: Readonly<FloatingSendButtonProps>,
		nextState: Readonly<FloatingSendButtonState>
	): boolean {
		return (
			this.props.onPressSendButton !== nextProps.onPressSendButton ||
			this.props.offline !== nextProps.offline ||
			this.state.keyboardHeight !== nextState.keyboardHeight
		);
	}

	private setKeyboardHeight = (height: number) => {
		this.setState({ keyboardHeight: height });
	};

	public render(): JSX.Element | null {
		if (!this.props.onPressSendButton || !this.state.keyboardHeight || this.props.offline) {
			RX.Animated.timing(this.animatedValue, {
				duration: animatedDuration,
				toValue: 0,
				easing: animatedEasing,
				useNativeDriver: true,
			}).start();
		} else {
			RX.Animated.timing(this.animatedValue, {
				duration: animatedDuration,
				toValue: 1,
				easing: animatedEasing,
				useNativeDriver: true,
			}).start();
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
				ignorePointerEvents={true}
			>
				<RX.Animated.View style={this.animatedStyle}>
					<AnimatedButton
						buttonStyle={styles.button}
						iconSource={require('../../resources/svg/RI_send.json') as SvgFile}
						iconFillColor={'white'}
						iconHeight={20}
						iconWidth={20}
						animatedColor={'white'}
						onPress={this.props.onPressSendButton!}
					/>
				</RX.Animated.View>
			</RX.View>
		);
	}
}
