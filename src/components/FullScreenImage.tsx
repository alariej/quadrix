import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { OPAQUE_DARK_BACKGROUND, TRANSPARENT_BACKGROUND, SPACING, BUTTON_ROUND_WIDTH, ICON_FULLSCREEN_FILL } from '../ui';
import UiStore from '../stores/UiStore';
import ScreenOrientation from '../modules/ScreenOrientation';
import DataStore from '../stores/DataStore';
import utils from '../utils/Utils';
import ApiClient from '../matrix/ApiClient';
import { MessageEvent_ } from '../models/MatrixApi';
import IconSvg, { SvgFile } from './IconSvg';
import Spinner from './Spinner';

const styles = {
    modalView: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: OPAQUE_DARK_BACKGROUND,
    }),
    gestureView: RX.Styles.createViewStyle({
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        backgroundColor: TRANSPARENT_BACKGROUND,
    }),
    image: RX.Styles.createImageStyle({
        flex: 1,
    }),
    nextButton: RX.Styles.createButtonStyle({
        position: 'absolute',
        backgroundColor: TRANSPARENT_BACKGROUND,
    }),
    spinnerContainer: RX.Styles.createViewStyle({
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    }),
    buttonFullscreen: RX.Styles.createViewStyle({
        position: 'absolute',
        right: 2 * SPACING,
        bottom: 2 * SPACING,
        width: BUTTON_ROUND_WIDTH,
        height: BUTTON_ROUND_WIDTH,
    }),
    containerIcon: RX.Styles.createViewStyle({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }),
};

interface FullScreenImageState {
    url: string;
    gestureImage: RX.Types.ImageStyleRuleSet | undefined;
    rotatedImage: RX.Types.ImageStyleRuleSet | undefined;
    showSpinner: boolean;
    isWebFullscreen: boolean;
}

interface FullScreenImageProps {
    roomId: string;
    eventId: string;
    url: string;
    imageRatio: number;
}

export default class FullScreenImage extends RX.Component<FullScreenImageProps, FullScreenImageState> {

    private screenWidth = 0;
    private screenHeight = 0;
    private imageWidth = 0;
    private imageHeight = 0;
    private zoomedWidth = 0;
    private zoomedHeight = 0;
    private lastPinchDist = 0;
    private lastPanH = 0;
    private lastPanV = 0;
    private positionH = 0;
    private positionV = 0;
    private imageRatio: number;
    private imageTimeline: MessageEvent_[];
    private eventId: string;
    private screenOrientation: string | undefined;
    private currentIndex: number;
    private platform: string;
    private nextButton: RX.Button | undefined;
    private isLoaded: boolean | undefined;

    constructor(props: FullScreenImageProps) {
        super(props);

        this.platform = UiStore.getPlatform();

        this.imageTimeline = DataStore.getImageTimeline(props.roomId);

        this.imageRatio = props.imageRatio;
        this.eventId = props.eventId;
        this.currentIndex = this.imageTimeline.findIndex(event => event.event_id === this.eventId);

        this.state = {
            url: props.url,
            gestureImage: undefined,
            rotatedImage: undefined,
            showSpinner: false,
            isWebFullscreen: false,
        }

        ScreenOrientation.hideStatusBar(true);
    }

    private onLayout = (event: RX.Types.LayoutInfo) => {

        this.screenWidth = event.width;
        this.screenHeight = event.height;

        this.setImageSize();
    }

    private setImageSize = () => {

        if (!this.screenOrientation || this.screenOrientation === 'portrait') {

            this.imageWidth = Math.min(this.imageRatio * this.screenHeight, this.screenWidth) || 200;
            this.imageHeight = Math.min(this.screenWidth / this.imageRatio, this.screenHeight) || 200;

        } else {

            this.imageWidth = Math.min(this.imageRatio * this.screenWidth, this.screenHeight) || 200;
            this.imageHeight = Math.min(this.screenHeight / this.imageRatio, this.screenWidth) || 200;
        }

        this.zoomedWidth = this.imageWidth;
        this.zoomedHeight = this.imageHeight;

        const gestureImage = RX.Styles.createImageStyle({
            width: this.imageWidth,
            height: this.imageHeight,
        }, false);

        this.setState({ gestureImage: gestureImage });
    }

    public componentDidMount(): void {

        setTimeout(() => {
            this.setState({ showSpinner: !this.isLoaded })
        }, 500);

        ScreenOrientation.addListener(this.onChangedOrientation);
    }

    public componentWillUnmount(): void {

        ScreenOrientation.hideStatusBar(false);
        ScreenOrientation.removeListener(this.onChangedOrientation);
    }

    private onChangedOrientation = (orientation: string) => {

        this.screenOrientation = orientation;

        this.setImageSize();

        let rotation: string;
        if (orientation === 'landscapeL') {
            rotation = '90deg';
        } else if (orientation === 'landscapeR') {
            rotation = '270deg';
        } else {
            rotation = '0deg';
        }

        const rotatedImage = RX.Styles.createViewStyle({
            transform: [{ rotate: rotation }],
        }, false);

        this.setState({ rotatedImage: rotatedImage });
    }

    private onPinchZoom = (state: RX.Types.MultiTouchGestureState) => {

        const pinchDist = state.distance;
        if (this.lastPinchDist === 0) { this.lastPinchDist = pinchDist; }

        const zoomFactor = (pinchDist - this.lastPinchDist) / pinchDist;

        if (Math.abs(zoomFactor) > 0.02) {

            this.lastPinchDist = pinchDist;
            this.setGestureImageStyle(zoomFactor);
        }

        if (state.isComplete) { this.lastPinchDist = 0; }
    }

    private onScrollWheel = (state: RX.Types.ScrollWheelGestureState) => {

        this.setGestureImageStyle(state.scrollAmount / 500);
    }

    private onPan = (state: RX.Types.PanGestureState) => {

        if (this.zoomedWidth === this.imageWidth) {

            if (!this.screenOrientation || this.screenOrientation === 'portrait') {

                const swipeL = state.initialClientX - state.clientX > 0;
                const swipeR = state.initialClientX - state.clientX < 0;

                if (this.currentIndex === 0 && swipeR) { return }
                if (this.currentIndex === this.imageTimeline.length - 1 && swipeL) { return }

                const panH_ = state.pageX;
                if (this.lastPanH === 0) { this.lastPanH = panH_; }

                const panH = (panH_ - this.lastPanH);

                if ((Math.abs(panH) > 5) && (Math.abs(panH) < 100)) {

                    this.lastPanH = panH_;
                    this.lastPanV = 0;
                    this.setGestureImageStyle(0, panH, 0);
                }

            } else {

                const swipeU = state.initialClientY - state.clientY > 0;
                const swipeD = state.initialClientY - state.clientY < 0;

                if (this.screenOrientation === 'landscapeR') {

                    if (this.currentIndex === 0 && swipeU) { return }
                    if (this.currentIndex === this.imageTimeline.length - 1 && swipeD) { return }

                } else {

                    if (this.currentIndex === 0 && swipeD) { return }
                    if (this.currentIndex === this.imageTimeline.length - 1 && swipeU) { return }
                }

                const panV_ = state.pageY;
                if (this.lastPanV === 0) { this.lastPanV = panV_; }

                const panV = (panV_ - this.lastPanV);

                if ((Math.abs(panV) > 5) && (Math.abs(panV) < 100)) {

                    this.lastPanH = 0;
                    this.lastPanV = panV_;
                    this.setGestureImageStyle(0, 0, panV);
                }
            }

            if (state.isComplete) {

                this.lastPanH = 0;
                this.lastPanV = 0;
                this.positionH = 0;
                this.positionV = 0;

                const swipeL = state.initialClientX - state.clientX > 50;
                const swipeR = state.initialClientX - state.clientX < -50;
                const swipeU = state.initialClientY - state.clientY > 50;
                const swipeD = state.initialClientY - state.clientY < -50;

                if (!this.screenOrientation || this.screenOrientation === 'portrait') {

                    this.showNextImage(swipeL ? 1 : swipeR ? -1 : 0);

                } else if (this.screenOrientation === 'landscapeR') {

                    this.showNextImage(swipeD ? 1 : swipeU ? -1 : 0);

                } else {

                    this.showNextImage(swipeU ? 1 : swipeD ? -1 : 0);
                }
            }

        } else {

            const panH_ = state.pageX;
            const panV_ = state.pageY;
            if (this.lastPanH === 0) { this.lastPanH = panH_; }
            if (this.lastPanV === 0) { this.lastPanV = panV_; }

            const panH = (panH_ - this.lastPanH);
            const panV = (panV_ - this.lastPanV);

            if ((Math.abs(panH) + Math.abs(panV) > 5) && (Math.abs(panH) + Math.abs(panV) < 100)) {

                this.lastPanH = panH_;
                this.lastPanV = panV_;
                this.setGestureImageStyle(0, panH, panV);
            }

            if (state.isComplete) { this.lastPanH = 0; this.lastPanV = 0; }
        }
    }

    private setGestureImageStyle = (zoomFactor?: number, panH?: number, panV?: number) => {

        let zoomedWidth: number | undefined;
        let zoomedHeight: number | undefined;
        let positionH: number | undefined;
        let positionV: number | undefined;

        if (zoomFactor) {

            zoomedWidth = Math.max(this.imageWidth, this.zoomedWidth * (1 + zoomFactor));
            zoomedHeight = Math.max(this.imageHeight, this.zoomedHeight * (1 + zoomFactor));

            this.zoomedWidth = zoomedWidth;
            this.zoomedHeight = zoomedHeight;
            positionH = this.positionH;
            positionV = this.positionV;

            if (this.zoomedWidth <= this.imageWidth) {
                zoomedWidth = undefined;
                zoomedHeight = undefined;
                positionH = 0;
                positionV = 0;
                this.positionH = positionH;
                this.positionV = positionV;
            }

        } else if (panH || panV) {

            positionH = this.positionH + panH!;
            positionV = this.positionV + panV!;
            this.positionH = positionH;
            this.positionV = positionV;

            zoomedWidth = this.zoomedWidth;
            zoomedHeight = this.zoomedHeight;
        }

        const gestureImage = RX.Styles.createImageStyle({
            width: zoomedWidth || this.imageWidth,
            height: zoomedHeight || this.imageHeight,
            left: positionH,
            top: positionV,
        }, false);

        this.setState({ gestureImage: gestureImage });
    }

    private showNextImage = (inc: number) => {

        if (inc === 0) { return }

        if (this.currentIndex + inc >= this.imageTimeline.length || this.currentIndex + inc < 0) { return }

        this.currentIndex = this.currentIndex + inc;

        const nextImage = this.imageTimeline[this.currentIndex];

        this.imageRatio = nextImage.content.info!.w! / nextImage.content.info!.h!;

        this.setImageSize();

        const url = utils.mxcToHttp(nextImage.content.url!, ApiClient.credentials.homeServer);

        this.setState({ url: url });

        this.eventId = nextImage.event_id;

        if (this.platform === 'web') { this.nextButton!.focus() }
    }

    private onKeyPress = (event: RX.Types.KeyboardEvent) => {

        if (event.keyCode === 39) {

            this.showNextImage(1);

        } else if (event.keyCode === 37) {

            this.showNextImage(-1);
        }
    }

    private onLoad = () => {

        this.isLoaded = true;
        this.setState({ showSpinner: false })
    }

    private toggleFullscreen = () => {

        const fullscreenImage = document.getElementById('imagefullscreenview');

        if (!document.fullscreenElement) {
            this.setState({ isWebFullscreen: true });
            fullscreenImage!.requestFullscreen().catch(_error => null);

        } else {
            this.setState({ isWebFullscreen: false });
            document.exitFullscreen().catch(_error => null);
        }
    }

    public render(): JSX.Element | null {

        const spinner = (
            <RX.View
                style={ styles.spinnerContainer }
                blockPointerEvents={ !this.state.showSpinner }
            >
                <Spinner isVisible={ this.state.showSpinner ? true : false } />
            </RX.View>
        );

        let buttonNext: ReactElement | undefined;
        let buttonPrevious: ReactElement | undefined;
        let buttonFullscreen: ReactElement | undefined;
        if (this.platform === 'web') {
            buttonNext = (
                <RX.Button
                    ref={ component => this.nextButton = component! }
                    style={ [styles.nextButton, { height: this.screenHeight, width: this.screenWidth / 5, right: 0 }] }
                    onPress={ () => this.showNextImage(1) }
                    disableTouchOpacityAnimation={ true }
                    autoFocus={ true }
                />
            );
            buttonPrevious = (
                <RX.Button
                    style={ [styles.nextButton, { height: this.screenHeight, width: this.screenWidth / 5, left: 0 }] }
                    disableTouchOpacityAnimation={ true }
                />
            );
            let iconFile;
            if (this.state.isWebFullscreen) {
                iconFile = require('../resources/svg/fullscreen_exit.json') as SvgFile;
            } else {
                iconFile = require('../resources/svg/fullscreen_enter.json') as SvgFile;
            }
            if (UiStore.getDesktopOS() !== 'MacOS') {
                buttonFullscreen = (
                    <RX.Button
                        style={ styles.buttonFullscreen }
                        onPress={ this.toggleFullscreen }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                    >
                        <RX.View style={ styles.containerIcon }>
                            <IconSvg
                                source= { iconFile }
                                fillColor={ ICON_FULLSCREEN_FILL }
                                height={ 16 }
                                width={ 16 }
                            />
                        </RX.View>
                    </RX.Button>
                )
            }
        }

        return (
            <RX.View
                id={ 'imagefullscreenview' }
                style={ styles.modalView }
                onLayout={ this.onLayout }
                onKeyPress={ this.onKeyPress }
            >
                <RX.Image
                    style={ [styles.image, this.state.gestureImage, this.state.rotatedImage] }
                    source={ this.state.url }
                    onLoad={ this.onLoad }
                />

                { spinner }

                <RX.GestureView
                    style={ styles.gestureView }
                    onTap={() => RX.Modal.dismissAll() }
                    onPinchZoom={ this.onPinchZoom }
                    onScrollWheel={ this.onScrollWheel }
                    onPan={ this.onPan }
                    panPixelThreshold={ 20 }
                />

                { buttonNext }
                { buttonPrevious }
                { buttonFullscreen }

            </RX.View>
        );
    }
}
