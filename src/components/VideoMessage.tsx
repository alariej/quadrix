import React from 'react';
import RX from 'reactxp';
import EventUtils from '../utils/EventUtils';
import ApiClient from '../matrix/ApiClient';
import { MessageEvent } from '../models/MessageEvent';
import { SPACING, BUTTON_ROUND_WIDTH, PAGE_MARGIN, BORDER_RADIUS } from '../ui';
import UiStore from '../stores/UiStore';
import VideoPlayer from '../modules/VideoPlayer';
import FullScreenVideo from './FullScreenVideo';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
        overflow: 'hidden',
        borderRadius: BORDER_RADIUS - 2,
    }),
    videoContainer: RX.Styles.createViewStyle({
        flex: 1,
    }),
}

interface VideoMessageProps {
    message: MessageEvent;
    showContextDialog: () => void;
}

export default class VideoMessage extends RX.Component<VideoMessageProps, RX.Stateless> {

    private url = '';
    private heightStyle: RX.Types.ViewStyleRuleSet;

    constructor(props: VideoMessageProps) {
        super(props);

        const width = (UiStore.getAppLayout_().pageWidth - 2 * PAGE_MARGIN) - (BUTTON_ROUND_WIDTH + SPACING) - 2 * SPACING;

        this.url = EventUtils.mxcToHttp(props.message.content.url!, ApiClient.credentials.homeServer);

        if (props.message.content.info!.w && props.message.content.info!.h) {
            this.heightStyle = RX.Styles.createViewStyle({
                height: width * props.message.content.info!.h / props.message.content.info!.w,
            }, false);
        } else {
            this.heightStyle = RX.Styles.createViewStyle({
                height: undefined,
            }, false);
        }
    }

    private showFullScreenVideo = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        RX.UserInterface.dismissKeyboard();

        let imageRatio = 1;
        if (this.props.message.content.info!.w && this.props.message.content.info!.h) {
            imageRatio = this.props.message.content.info!.w / this.props.message.content.info!.h;
        }

        const fullScreenVideo = (
            <FullScreenVideo
                url={ this.url }
                mimeType={ this.props.message.content.info?.mimetype || 'video/mp4' }
                imageRatio={ imageRatio }
            />
        );

        RX.Modal.show(fullScreenVideo, 'fullscreenvideo');
    }

    public render(): JSX.Element | null {

        return (
            <RX.View
                style={ [styles.container, this.heightStyle] }
                onPress={ this.showFullScreenVideo }
                onLongPress={ () => this.props.showContextDialog() }
                onContextMenu={ () => this.props.showContextDialog() }
                disableTouchOpacityAnimation={ true }
            >
                <RX.View
                    style={ styles.videoContainer }
                    blockPointerEvents={ true }
                >
                    <VideoPlayer
                        uri={ this.url }
                        mimeType={ this.props.message.content.info?.mimetype || 'video/mp4' }
                        autoplay={ false }
                    />
                </RX.View>
            </RX.View>
        );
    }
}
