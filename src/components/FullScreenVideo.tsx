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
        justifyContent: 'center',
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

    constructor(props: FullScreenVideoProps) {
        super(props);

        const appLayout = UiStore.getAppLayout_();

        this.appWidth = appLayout.screenWidth;
        this.appHeight = appLayout.screenHeight;

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
            <RX.View style={ styles.modalView }>
                <RX.View style={{ flex: 1, height: this.appHeight, width: this.appWidth }}>
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
