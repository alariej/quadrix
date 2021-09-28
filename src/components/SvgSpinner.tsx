import * as React from 'react';
import * as RX from 'reactxp';
import RXImageSvg, { SvgPath as RXSvgPath } from 'reactxp-imagesvg';

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
            <RX.Animated.View style={ this.animatedStyle }>
                <RXImageSvg
                    viewBox={ '0 0 42.5 42.5' }
                    height={ this.props.size }
                    width={ this.props.size }
                >
                    <RXSvgPath
                        fillColor={ this.props.color }
                        fillOpacity={ 0.8 }
                        d={ 'M 21.25,1.25 A 20,20 0 0 0 1.25,21.25 20,20 0 0 0 21.25,41.25 20,20 0 0 0 41.25,21.25 20,20 0 0 0 21.25,1.25 Z m 0,2.5 A 17.5,17.5 0 0 1 38.75,21.25 17.5,17.5 0 0 1 21.25,38.75 17.5,17.5 0 0 1 3.75,21.25 17.5,17.5 0 0 1 21.25,3.75 Z' } // eslint-disable-line
                    />
                    <RXSvgPath
                        fillColor={ this.props.color }
                        d={ 'M 21.25,0 A 21.25,21.25 0 0 0 6.233,6.233 L 9.766,9.766 A 16.25,16.25 0 0 1 21.25,5 16.25,16.25 0 0 1 32.733,9.766 L 36.266,6.233 A 21.25,21.25 0 0 0 21.25,0 Z' } // eslint-disable-line
                    />
                </RXImageSvg>
            </RX.Animated.View>
        );
    }
}
