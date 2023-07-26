import * as React from 'react';
import * as RX from 'reactxp';
import IconSvg, { SvgFile } from './IconSvg';

interface AnimatedSpinnerProps {
	color: string;
	size: number;
}

export default class AnimatedSpinner extends RX.Component<AnimatedSpinnerProps, RX.Stateless> {
	private animatedValue: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
	private animatedLoop: RX.Types.Animated.LoopConfig;

	constructor(props: AnimatedSpinnerProps) {
		super(props);

		this.animatedValue = RX.Animated.createValue(0);
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			transform: [
				{
					rotate: this.animatedValue.interpolate({
						inputRange: [0, 1],
						outputRange: ['0deg', '360deg'],
					}),
				},
			],
		});
		this.animatedLoop = {
			restartFrom: 0,
		};
	}

	public componentDidMount(): void {
		RX.Animated.timing(this.animatedValue, {
			duration: 1000,
			toValue: 1,
			easing: RX.Animated.Easing.Linear(),
			loop: this.animatedLoop,
			useNativeDriver: true,
		}).start();
	}

	public render(): JSX.Element | null {
		const borderRadius = 1;
		const arcWidth = this.props.size / 2 - borderRadius;

		return (
			<RX.View
				style={{
					height: this.props.size,
					width: this.props.size,
					borderRadius: this.props.size / 2,
				}}
			>
				<RX.Animated.View
					style={[
						this.animatedStyle,
						{
							height: this.props.size,
							width: this.props.size,
							borderRadius: this.props.size / 2,
							borderWidth: borderRadius,
							borderColor: this.props.color,
						},
					]}
				>
					<IconSvg
						source={require('../resources/svg/arc.json') as SvgFile}
						height={arcWidth}
						width={arcWidth}
						fillColor={this.props.color}
					/>
				</RX.Animated.View>
			</RX.View>
		);
	}
}
