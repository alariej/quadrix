import React from 'react';
import RX from 'reactxp';
import ScreenOrientation from '../modules/ScreenOrientation';
import VideoPlayer from '../modules/VideoPlayer';
import UiStore from '../stores/UiStore';
import { OPAQUE_DARK_BACKGROUND, TRANSPARENT_BACKGROUND } from '../ui';

const styles = {
    modalView: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        alignItems: 'center',
        backgroundColor: OPAQUE_DARK_BACKGROUND,
    }),
    closeButton: RX.Styles.createButtonStyle({
        position: 'absolute',
        top: -200,
        bottom: 50,
        left: 0,
        right: 0,
        backgroundColor: TRANSPARENT_BACKGROUND,
        cursor: 'pointer',
    }),
}

interface FullScreenVideoProps {
    url: string;
    mimeType: string;
    imageRatio: number;
}

export default class FullScreenVideo extends RX.Component<FullScreenVideoProps, RX.Stateless> {

    private appHeight: number;
    private appWidth: number;
    private alignStyle: RX.Types.ViewStyleRuleSet;

    constructor(props: FullScreenVideoProps) {
        super(props);

        const appLayout = UiStore.getAppLayout_();
        const screenRatio = appLayout.screenWidth / appLayout.screenHeight;
        const screenImageRatio = screenRatio / props.imageRatio;

        if (screenImageRatio <= 1) {
            this.appWidth = appLayout.screenWidth;
            this.appHeight = appLayout.screenWidth / props.imageRatio;
            this.alignStyle = RX.Styles.createViewStyle({
                justifyContent: 'center',
            }, false);
        } else if (screenImageRatio > 1 && screenImageRatio < 1.10 && UiStore.getPlatform() !== 'android') {
            this.appWidth = appLayout.screenWidth;
            this.appHeight = appLayout.screenWidth / props.imageRatio;
            this.alignStyle = RX.Styles.createViewStyle({
                justifyContent: 'flex-end',
            }, false);
        } else {
            this.appWidth = appLayout.screenHeight * props.imageRatio;
            this.appHeight = appLayout.screenHeight;
            this.alignStyle = RX.Styles.createViewStyle({
                justifyContent: 'center',
            }, false);
        }

        ScreenOrientation.hideStatusBar(true);
    }

    private onPressCloseButton = () => {

        ScreenOrientation.hideStatusBar(false);

        RX.Modal.dismiss('fullscreenvideo');
    }

    public render(): JSX.Element | null {

        const closeButton = (
            <RX.Button
                style={ styles.closeButton }
                onPress={ this.onPressCloseButton }
                disableTouchOpacityAnimation={ true }
                activeOpacity={ 1 }
            />
        );

        return (
            <RX.View style={ [styles.modalView, this.alignStyle] }>
                <RX.View style={{ height: this.appHeight, width: this.appWidth }}>
                    <VideoPlayer
                        uri={ this.props.url }
                        mimeType={ this.props.mimeType || 'video/mp4' }
                        autoplay={ true }
                    />
                    { closeButton }
                </RX.View>
            </RX.View>
        )
    }
}
