import * as React from 'react';
import * as RX from 'reactxp';
import IconSvg, { SvgFile } from './IconSvg';
import { LOGO_FILL, STACKED_BUTTON_HEIGHT } from '../ui';

const styles = {
	container: RX.Styles.createViewStyle({
		// not used
	}),
	button: RX.Styles.createButtonStyle({
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	}),
	animated: RX.Styles.createViewStyle({
		position: 'absolute',
		top: 0,
		left: 0,
	}),
};
interface MenuButtonProps {
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
	noIcon?: boolean;
	buttonHeight?: number;
	numberOfLines?: number;
}

export default class MenuButton extends RX.Component<MenuButtonProps, RX.Stateless> {
	private animatedOpacity: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;

	constructor(props: MenuButtonProps) {
		super(props);

		this.animatedOpacity = RX.Animated.createValue(0);
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			opacity: this.animatedOpacity,
		});
	}

	private onPress = (e: RX.Types.SyntheticEvent) => {
		e.stopPropagation();
		RX.Animated.timing(this.animatedOpacity, {
			duration: 25,
			toValue: 0.7,
			easing: RX.Animated.Easing.Out(),
			useNativeDriver: true,
		}).start();

		setTimeout(() => {
			RX.Animated.timing(this.animatedOpacity, {
				duration: 200,
				toValue: 0,
				easing: RX.Animated.Easing.Out(),
				useNativeDriver: true,
			}).start(() => {
				this.props.onPress(e);
			});
		}, 25);
	};

	public render(): JSX.Element | null {
		let buttonText: React.ReactElement | undefined;
		if (this.props.text) {
			buttonText = (
				<RX.Text
					allowFontScaling={false}
					style={this.props.textStyle}
					numberOfLines={this.props.numberOfLines || 1}
				>
					{this.props.text}
				</RX.Text>
			);
		}

		let icon;
		if (!this.props.noIcon) {
			icon = (
				<IconSvg
					source={this.props.iconSource}
					style={this.props.iconStyle}
					fillColor={this.props.iconFillColor}
					height={this.props.iconHeight}
					width={this.props.iconWidth}
				/>
			);
		}

		return (
			<RX.View style={styles.container}>
				<RX.Button
					style={[styles.button, this.props.buttonStyle]}
					onPress={this.onPress}
					disableTouchOpacityAnimation={true}
					disabled={this.props.disabled}
					disabledOpacity={1}
				>
					<RX.View
						style={{
							alignItems: 'center',
							justifyContent: 'center',
							height: this.props.buttonHeight || STACKED_BUTTON_HEIGHT,
							width: this.props.buttonHeight || STACKED_BUTTON_HEIGHT,
							borderRadius: (this.props.buttonHeight || STACKED_BUTTON_HEIGHT) / 2,
							backgroundColor: LOGO_FILL,
						}}
					>
						{icon}
					</RX.View>
					{buttonText}
				</RX.Button>
				<RX.Animated.View
					style={[
						this.animatedStyle,
						styles.animated,
						this.props.buttonStyle,
						{
							backgroundColor: this.props.animatedColor,
							borderRadius: (this.props.buttonHeight || STACKED_BUTTON_HEIGHT) / 2,
						},
					]}
					ignorePointerEvents={true}
				/>
			</RX.View>
		);
	}
}
