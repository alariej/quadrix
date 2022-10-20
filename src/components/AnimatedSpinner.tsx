import * as React from 'react';
import * as RX from 'reactxp';

interface AnimatedSpinnerProps {
	color: string;
	size: number;
}

const animatedSizeStart = 1;
const animatedSizeStop = 0.5;
const animatedDuration = 250;
const loopDuration = 1500;
const easing = RX.Animated.Easing.Out();

export default class AnimatedSpinner extends RX.Component<AnimatedSpinnerProps, RX.Stateless> {
	private animatedScale1: RX.Animated.Value;
	private animatedScale2: RX.Animated.Value;
	private animatedScale3: RX.Animated.Value;
	private animatedStyle1: RX.Types.AnimatedViewStyleRuleSet;
	private animatedStyle2: RX.Types.AnimatedViewStyleRuleSet;
	private animatedStyle3: RX.Types.AnimatedViewStyleRuleSet;
	private animation1: RX.Types.Animated.CompositeAnimation;
	private animation2: RX.Types.Animated.CompositeAnimation;
	private animation3: RX.Types.Animated.CompositeAnimation;
	private animation4: RX.Types.Animated.CompositeAnimation;
	private _isMounted = false;

	constructor(props: AnimatedSpinnerProps) {
		super(props);

		this.animatedScale1 = RX.Animated.createValue(animatedSizeStart);
		this.animatedScale2 = RX.Animated.createValue(animatedSizeStart);
		this.animatedScale3 = RX.Animated.createValue(animatedSizeStart);

		this.animatedStyle1 = RX.Styles.createAnimatedViewStyle({
			transform: [{ scale: this.animatedScale1 }],
		});
		this.animatedStyle2 = RX.Styles.createAnimatedViewStyle({
			transform: [{ scale: this.animatedScale2 }],
		});
		this.animatedStyle3 = RX.Styles.createAnimatedViewStyle({
			transform: [{ scale: this.animatedScale3 }],
		});

		this.animation1 = RX.Animated.timing(this.animatedScale1, {
			duration: animatedDuration,
			toValue: animatedSizeStop,
			easing: easing,
			useNativeDriver: true,
		});

		this.animation2 = RX.Animated.timing(this.animatedScale2, {
			duration: animatedDuration,
			toValue: animatedSizeStop,
			easing: easing,
			useNativeDriver: true,
		});

		this.animation3 = RX.Animated.timing(this.animatedScale3, {
			duration: animatedDuration,
			toValue: animatedSizeStop,
			easing: easing,
			useNativeDriver: true,
		});

		this.animation4 = RX.Animated.parallel([
			RX.Animated.timing(this.animatedScale1, {
				duration: animatedDuration,
				toValue: animatedSizeStart,
				easing: easing,
				useNativeDriver: true,
			}),
			RX.Animated.timing(this.animatedScale2, {
				duration: animatedDuration,
				toValue: animatedSizeStart,
				easing: easing,
				useNativeDriver: true,
			}),
			RX.Animated.timing(this.animatedScale3, {
				duration: animatedDuration,
				toValue: animatedSizeStart,
				easing: easing,
				useNativeDriver: true,
			}),
		]);
	}

	private animateSpinner = () => {
		this.animation1?.start(() => {
			this.animation2?.start(() => {
				this.animation3?.start(() => {
					this.animation4?.start();
				});
			});
		});

		if (this._isMounted) {
			setTimeout(() => {
				this.animateSpinner();
			}, loopDuration);
		}
	};

	public componentDidMount(): void {
		this._isMounted = true;
		this.animateSpinner();
	}

	public componentWillUnmount(): void {
		this._isMounted = false;
	}

	public render(): JSX.Element | null {
		return (
			<RX.View
				style={{
					flex: 1,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<RX.Animated.View
					style={[
						this.animatedStyle1,
						{
							height: this.props.size / 3,
							width: this.props.size / 3,
							borderRadius: this.props.size / 15,
							margin: this.props.size / 15,
							backgroundColor: this.props.color,
						},
					]}
				/>
				<RX.Animated.View
					style={[
						this.animatedStyle2,
						{
							height: this.props.size / 3,
							width: this.props.size / 3,
							borderRadius: this.props.size / 15,
							margin: this.props.size / 15,
							backgroundColor: this.props.color,
						},
					]}
				/>
				<RX.Animated.View
					style={[
						this.animatedStyle3,
						{
							height: this.props.size / 3,
							width: this.props.size / 3,
							borderRadius: this.props.size / 15,
							margin: this.props.size / 15,
							backgroundColor: this.props.color,
						},
					]}
				/>
			</RX.View>
		);
	}
}
