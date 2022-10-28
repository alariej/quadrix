import * as React from 'react';
import * as RX from 'reactxp';
import IconSvg, { SvgFile } from './IconSvg';

const styles = {
	container: RX.Styles.createViewStyle({
		// not used
	}),
	animated: RX.Styles.createViewStyle({
		position: 'absolute',
		top: 0,
		left: 0,
	}),
};
interface AnimatedButtonProps {
	buttonStyle?: RX.Types.ViewStyleRuleSet;
	onPress: (e: RX.Types.SyntheticEvent) => void;
	disabled?: boolean;
	iconSource: SvgFile;
	iconFillColor: string;
	iconHeight: number;
	iconWidth: number;
	iconStyle?: RX.Types.ViewStyleRuleSet;
	animatedColor: string;
	text?: string;
	textStyle?: RX.Types.TextStyleRuleSet | RX.Types.TextStyleRuleSet[];
}

export default class AnimatedButton extends RX.Component<AnimatedButtonProps, RX.Stateless> {
	private animatedOpacity: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;

	constructor(props: AnimatedButtonProps) {
		super(props);

		this.animatedOpacity = RX.Animated.createValue(0);
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			opacity: this.animatedOpacity,
		});
	}

	private onPress = (e: RX.Types.SyntheticEvent) => {
		e.stopPropagation();
	};

	private onPressIn = (e: RX.Types.SyntheticEvent) => {
		e.stopPropagation();
		RX.Animated.timing(this.animatedOpacity, {
			duration: 10,
			toValue: 0.7,
			easing: RX.Animated.Easing.Out(),
			useNativeDriver: true,
		}).start();
	};

	private onPressOut = (e: RX.Types.SyntheticEvent) => {
		e.stopPropagation();
		RX.Animated.timing(this.animatedOpacity, {
			duration: 200,
			toValue: 0,
			easing: RX.Animated.Easing.Out(),
			useNativeDriver: true,
		}).start(() => {
			this.props.onPress(e);
		});
	};

	public render(): JSX.Element | null {
		let buttonText: React.ReactElement | undefined;
		if (this.props.text) {
			buttonText = (
				<RX.Text
					allowFontScaling={false}
					style={this.props.textStyle}
					numberOfLines={1}
				>
					{this.props.text}
				</RX.Text>
			);
		}

		return (
			<RX.View style={styles.container}>
				<RX.Button
					style={this.props.buttonStyle}
					onPress={this.onPress}
					onPressIn={this.onPressIn}
					onPressOut={this.onPressOut}
					disableTouchOpacityAnimation={true}
					disabled={this.props.disabled}
					disabledOpacity={1}
				>
					{buttonText}
					<IconSvg
						source={this.props.iconSource}
						style={this.props.iconStyle}
						fillColor={this.props.iconFillColor}
						height={this.props.iconHeight}
						width={this.props.iconWidth}
					/>
				</RX.Button>
				<RX.Animated.View
					style={[
						this.animatedStyle,
						styles.animated,
						this.props.buttonStyle,
						{ backgroundColor: this.props.animatedColor },
					]}
					ignorePointerEvents={true}
				/>
			</RX.View>
		);
	}
}
