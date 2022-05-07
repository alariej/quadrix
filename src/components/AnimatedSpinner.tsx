import * as React from 'react';
import * as RX from 'reactxp';

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

        const ringWidth = this.props.size / 4;

        return (
            <RX.View style={{
                height: this.props.size,
                width: this.props.size,
                borderRadius: this.props.size / 2,
                overflow: 'hidden'
            }}>
                <RX.Animated.View style={[
                    this.animatedStyle,
                    {
                        height: this.props.size,
                        width: this.props.size,
                        borderRadius: this.props.size / 2,
                        borderWidth: 1,
                        borderColor: this.props.color,
                        alignItems: 'center',
                    }
                ]}>
                    <RX.View
                        style={{
                            height: ringWidth,
                            width: ringWidth,
                            borderRadius: ringWidth / 2,
                            backgroundColor: this.props.color,
                            margin: -ringWidth / 2
                        }}
                    />
                </RX.Animated.View>
            </RX.View>
        )
    }
}
