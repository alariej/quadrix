import * as React from 'react';
import * as RX from 'reactxp';
import { BUTTON_FILL } from '../ui';

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
            transform: [{
                rotate: this.animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                })
            }]
        });
        this.animatedLoop = {
            restartFrom: 0,
        }
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

        const ringWidth = this.props.size / 5;
        const baseRingOffset = this.props.size / 8;
        const blueRingOffest = baseRingOffset + this.props.size / 6;

        return (
            <RX.Animated.View style={[
                this.animatedStyle,
                {
                    height: this.props.size + blueRingOffest,
                    width: this.props.size + blueRingOffest,
                    overflow: 'visible'
                }
            ]}>
                <RX.View
                    style={{
                        position: 'absolute',
                        top: baseRingOffset,
                        left: blueRingOffest / 2,
                        height: this.props.size,
                        width: this.props.size,
                        borderRadius: this.props.size / 2,
                        borderWidth: ringWidth,
                        borderColor: this.props.color,
                        opacity: 0.7
                    }}
                />
                <RX.View
                    style={{
                        position: 'absolute',
                        top: blueRingOffest,
                        left: blueRingOffest / 2,
                        height: this.props.size,
                        width: this.props.size,
                        borderRadius: this.props.size / 2,
                        borderWidth: ringWidth,
                        borderColor: BUTTON_FILL,
                        opacity: 0.4
                    }}
                />
            </RX.Animated.View>
        )
    }
}
