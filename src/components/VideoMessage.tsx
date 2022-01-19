import React from 'react';
import RX from 'reactxp';
import EventUtils from '../utils/EventUtils';
import ApiClient from '../matrix/ApiClient';
import { MessageEvent } from '../models/MessageEvent';
import { SPACING, BUTTON_ROUND_WIDTH, PAGE_MARGIN, BORDER_RADIUS } from '../ui';
import UiStore from '../stores/UiStore';
import VideoPlayer from '../modules/VideoPlayer';

const styles = {
    containerMessage: RX.Styles.createViewStyle({
        // not used
    }),
    video: RX.Styles.createImageStyle({
        flex: 1,
        borderRadius: BORDER_RADIUS - 2,
    }),
};

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

    public render(): JSX.Element | null {

        return (
            <RX.View style={ styles.containerMessage }>
                <RX.View
                    style={ this.heightStyle }
                    onLongPress={ () => this.props.showContextDialog() }
                    onContextMenu={ () => this.props.showContextDialog() }
                    disableTouchOpacityAnimation={ true }
                >
                    <VideoPlayer
                        uri={ this.url }
                    />
                </RX.View>
            </RX.View>
        );
    }
}
