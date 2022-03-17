import * as React from 'react';
import * as RX from 'reactxp';

interface SvgSpinnerProps {
    color: string;
    size: number;
}

export default class SvgSpinner extends RX.Component<SvgSpinnerProps, RX.Stateless> {

    private animatedValue: RX.Animated.Value;
    private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
    private animatedLoop: RX.Types.Animated.LoopConfig;

    constructor(props: SvgSpinnerProps) {
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

        return (
            <RX.Animated.View style={ [this.animatedStyle, { overflow: 'visible' }] }>
                <RX.View
                    style={{
                        height: this.props.size,
                        width: this.props.size,
                        borderRadius: this.props.size / 2,
                        borderWidth: this.props.size / 6,
                        borderColor: this.props.color,
                        // padding: SPACING,
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        overflow: 'visible'
                    }}
                >
                    <RX.View
                        style={{
                            height: this.props.size / 6,
                            width: this.props.size / 6,
                            marginTop: - this.props.size / 6,
                            backgroundColor: 'black',
                            opacity: 0.3,
                        }}
                    />
                    <RX.View
                        style={{
                            height: this.props.size / 6,
                            width: this.props.size / 6,
                            marginTop: this.props.size - 2 * this.props.size / 6,
                            backgroundColor: 'black',
                            opacity: 0.3,
                        }}
                    />
                </RX.View>
            </RX.Animated.View>
        )
    }
}
