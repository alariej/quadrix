import React from 'react';
import RX from 'reactxp';
import ScreenOrientation from '../modules/ScreenOrientation';
import VideoPlayer from '../modules/VideoPlayer';
import UiStore from '../stores/UiStore';
import { LOGO_BACKGROUND, OBJECT_MARGIN, OPAQUE_DARK_BACKGROUND, OPAQUE_WHITE_BACKGROUND } from '../ui';
import IconSvg, { SvgFile } from './IconSvg';

const styles = {
    modalView: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        alignItems: 'center',
        backgroundColor: OPAQUE_DARK_BACKGROUND,
    }),
    closeButton: RX.Styles.createButtonStyle({
        position: 'absolute',
        top: OBJECT_MARGIN,
        right: OBJECT_MARGIN,
        width: 32,
        height: 32,
        borderRadius: 32 / 2,
        backgroundColor: OPAQUE_WHITE_BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
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
        } else if (screenImageRatio > 1 && screenImageRatio < 1.10) {
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

        const isWeb = UiStore.getPlatform() === 'web';

        const rotateStyle = RX.Styles.createViewStyle({
            transform: [{ rotate: '45deg' }],
        }, false);

        const closeButton = (
            <RX.Button
                style={ [styles.closeButton, isWeb ? rotateStyle : undefined] }
                onPress={ this.onPressCloseButton }
                disableTouchOpacityAnimation={ true }
                activeOpacity={ 1 }
            >
                <IconSvg
                    source= { require('../resources/svg/plus.json') as SvgFile }
                    style={ !isWeb ? rotateStyle : undefined }
                    fillColor={ LOGO_BACKGROUND }
                    height={ 16 }
                    width={ 16 }
                />
            </RX.Button>
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
        )
    }
}
