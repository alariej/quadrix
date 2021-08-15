import React from 'react';
import RX from 'reactxp';
import utils from '../utils/Utils';
import ApiClient from '../matrix/ApiClient';
import { MessageEvent } from '../models/MessageEvent';
import FullScreenImage from './FullScreenImage';
import { SPACING, BUTTON_ROUND_WIDTH, PAGE_MARGIN, BORDER_RADIUS } from '../ui';
import UiStore from '../stores/UiStore';
import { Headers } from 'reactxp/dist/common/Types';
import Loading from '../modules/Loading';

const styles = {
    containerMessage: RX.Styles.createViewStyle({
        flexDirection: 'column',
        cursor: 'pointer',
    }),
    image: RX.Styles.createImageStyle({
        flex: 1,
        borderRadius: BORDER_RADIUS - 2,
    }),
    spinnerContainer: RX.Styles.createViewStyle({
        position: 'absolute',
        left: 0,
        right: 0,
        top:0,
        bottom:0,
        justifyContent: 'center',
        alignItems: 'center',
    }),
};

interface ImageMessageState {
    showSpinner: boolean;
}

interface ImageMessageProps {
    roomId: string;
    message: MessageEvent;
    showContextDialog: () => void;
}

export default class ImageMessage extends RX.Component<ImageMessageProps, ImageMessageState> {

    private url = '';
    private urlFull = '';
    private heightStyle: RX.Types.ViewStyleRuleSet;
    private imageRatio = 0;

    constructor(props: ImageMessageProps) {
        super(props);

        this.state = { showSpinner: false }

        const width = (UiStore.getAppLayout_().pageWidth - 2 * PAGE_MARGIN) - (BUTTON_ROUND_WIDTH + SPACING) - 2 * SPACING;

        if (props.message.content.info!.thumbnail_url) {

            this.url = utils.mxcToHttp(this.props.message.content.info!.thumbnail_url!, ApiClient.credentials.homeServer);

            this.heightStyle = RX.Styles.createViewStyle({
                height: width * props.message.content.info!.thumbnail_info!.h / props.message.content.info!.thumbnail_info!.w,
            }, false);

            this.urlFull = utils.mxcToHttp(props.message.content.url!, ApiClient.credentials.homeServer);

        } else {

            this.url = utils.mxcToHttp(props.message.content.url!, ApiClient.credentials.homeServer);

            if (props.message.content.info!.w && props.message.content.info!.h) {

                this.heightStyle = RX.Styles.createViewStyle({
                    height: width * props.message.content.info!.h / props.message.content.info!.w,
                }, false);

            } else {

                this.heightStyle = RX.Styles.createViewStyle({
                    height: width,
                }, false);
            }

            this.urlFull = this.url;
        }
    }

    public componentDidMount(): void {

        setTimeout(() => {
            this.setState({ showSpinner: this.imageRatio === 0 })
        }, 500);
    }

    private showFullScreenImage = () => {

        if (this.state.showSpinner) { return; }

        const fullScreenImage = (
            <FullScreenImage
                roomId={ this.props.roomId }
                eventId={ this.props.message.eventId }
                url={ this.urlFull }
                imageRatio={ this.imageRatio }
            />
        );

        RX.Modal.show(fullScreenImage, 'fullscreenimage');
    }

    private onLoad = (size: { width: number, height: number }) => {

        this.setState({ showSpinner: false });

        this.imageRatio = size.width / size.height;
    }

    public render(): JSX.Element | null {

        const spinner = (
            <RX.View
                style={ styles.spinnerContainer }
                blockPointerEvents={ !this.state.showSpinner }
            >
                <Loading isVisible={ this.state.showSpinner ? true : false } />
            </RX.View>
        );

        let headers: Headers = {};
        if (UiStore.getPlatform() === 'ios') {
            headers = {'Cache-Control':'max-stale'};
        }

        return (
            <RX.View style={ styles.containerMessage }>
                <RX.View
                    style={ this.heightStyle }
                    onPress={ this.showFullScreenImage }
                    onLongPress={ () => this.props.showContextDialog() }
                    onContextMenu={ () => this.props.showContextDialog() }
                    disableTouchOpacityAnimation={ true }
                >
                    <RX.Image
                        resizeMode={ 'contain' }
                        style={ styles.image }
                        source={ this.url }
                        onLoad={ size => this.onLoad(size) }
                        headers={ headers }
                    />

                    { spinner }

                </RX.View>
            </RX.View>
        );
    }
}
