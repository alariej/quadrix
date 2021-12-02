import React from 'react';
import FastImage, { OnLoadEvent } from 'react-native-fast-image';
import { Image } from 'react-native';
import RX from 'reactxp';
import UiStore from '../stores/UiStore';
// import FileHandler from '../modules/FileHandler';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
    }),
};

interface CachedImageProps {
    resizeMode: RX.Types.ImageResizeMode;
    style: RX.Types.StyleRuleSetRecursive<RX.Types.ImageStyleRuleSet>,
    source: string;
    headers?: RX.Types.Headers | undefined;
    onLoad?: (size: RX.Types.Dimensions) => void;
    mimeType?: string;
    animated?: boolean;
}

export default class CachedImage extends RX.Component<CachedImageProps, RX.Stateless> {

    private animatedOpacity!: RX.Animated.Value;
    private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
    private t1 = 0;
    private t2 = 0;

    constructor(props: CachedImageProps) {
        super(props);

        this.animatedOpacity = RX.Animated.createValue(this.props.animated ? 0 : 1);
        this.animatedStyle = RX.Styles.createAnimatedViewStyle({
            opacity: this.animatedOpacity,
        });

        if (this.props.animated) {
            RX.Animated.timing(this.animatedOpacity, {
                duration: 500,
                toValue: 1,
                easing: RX.Animated.Easing.Out(),
                useNativeDriver: true,
            }).start();
        }
    }

    private onLoad1 = (size: RX.Types.Dimensions) => {

        this.props.onLoad ? this.props.onLoad(size) : null;

        console.log('************************4')

        this.t2 = new Date().getTime();
        console.log(this.t2 - this.t1);
    }

    private onLoad2 = (e: OnLoadEvent) => {

        const size: RX.Types.Dimensions = {
            width: e.nativeEvent.width,
            height: e.nativeEvent.height
        }

        this.props.onLoad ? this.props.onLoad(size) : null;

        console.log('************************4')

        this.t2 = new Date().getTime();
        console.log(this.t2 - this.t1);
    }

    public render(): JSX.Element | null {

        this.t1 = new Date().getTime();

        // /* 
        // @ts-ignore
        Image.queryCache([this.props.source])
            .then(response => {
                console.log('************************5')
                console.log(response)
            })
            .catch(_error => console.log(_error));
        // */

        const backgroundColor = this.props.animated && this.props.mimeType === 'image/jpeg' ? UiStore.getAppColor() : undefined;

        return (
            <RX.View style={ [this.props.style, { backgroundColor: backgroundColor, overflow: 'hidden' }] }>
                <RX.Animated.View style={ [styles.container, this.animatedStyle] }>
                    <FastImage
                        // resizeMode={ FastImage.resizeMode.contain }
                        // @ts-ignore
                        resizeMode={ this.props.resizeMode }
                        style={{ flex: 1 }}
                        source={{ uri: this.props.source }}
                        onLoad={ this.onLoad2 }
                    />
                </RX.Animated.View>
            </RX.View>
        );

        return (
            <RX.View style={{ flex: 1, backgroundColor: backgroundColor }}>
                <RX.Animated.View style={ [styles.container, this.animatedStyle] }>
                    <RX.Image
                        resizeMode={ this.props.resizeMode }
                        style={ this.props.style }
                        source={ this.props.source }
                        onLoad={ this.onLoad1 }
                    />
                </RX.Animated.View>
            </RX.View>
        );
        
    }
}
