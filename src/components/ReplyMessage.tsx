import React, { ReactElement } from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import { MessageEvent } from '../models/MessageEvent';
import AppFont from '../modules/AppFont';
import CachedImage from '../modules/CachedImage';
import DataStore from '../stores/DataStore';
import { BORDER_RADIUS, BUTTON_FILL, COMPOSER_BORDER, FONT_NORMAL, SPACING, TILE_BACKGROUND, TILE_SYSTEM_TEXT } from '../ui';
import EventUtils from '../utils/EventUtils';
import IconSvg, { SvgFile } from './IconSvg';

const styles = {
    replyContainer: RX.Styles.createViewStyle({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING,
        borderRadius: BORDER_RADIUS,
        borderBottomWidth: 1,
        borderColor: COMPOSER_BORDER
    }),
    textReplySender: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_NORMAL,
        color: TILE_SYSTEM_TEXT,
        fontWeight: 'bold',
        fontStyle: 'italic',
    }),
    textReplyMessage: RX.Styles.createTextStyle({
        flex: 1,
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_NORMAL,
        color: TILE_SYSTEM_TEXT,
        marginLeft: SPACING
    }),
    replyImageContainer: RX.Styles.createViewStyle({
        flex: 1,
        height: 32,
        alignItems: 'flex-start',
        marginLeft: SPACING
    }),
    replyImage: RX.Styles.createImageStyle({
        flex: 1,
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS,
    }),
    cancelReply: RX.Styles.createViewStyle({
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: BUTTON_FILL,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING,
        transform: [{ rotate: '45deg' }],
    }),
}

interface ReplyMessageProps {
    replyEvent: MessageEvent;
    roomId: string;
    onCancelButton?: () => void;
}

export default class ReplyMessage extends RX.Component<ReplyMessageProps, RX.Stateless> {

    private getUserDisplayName = (userId: string): string => {
        const roomSummary = DataStore.getRoomSummary(this.props.roomId);
        return roomSummary.members[userId].name || userId.split('@')[1].split(':')[0];
    }

    public render(): ReactElement | null {

        let replyContent: ReactElement;
        if (this.props.replyEvent.content.msgtype === 'm.image') {
            const source = EventUtils.mxcToHttp(this.props.replyEvent.content.url!, ApiClient.credentials.homeServer);
            replyContent = (
                <RX.View style={ styles.replyImageContainer }>
                    <CachedImage
                        resizeMode={ 'cover' }
                        style={ styles.replyImage }
                        source={ source }
                        mimeType={ this.props.replyEvent.content.info?.mimetype }
                        animated={ false }
                    />
                </RX.View>
            );
        } else if (this.props.replyEvent.content.msgtype === 'm.video') {

            const thumbnailUrl = this.props.replyEvent.content.info?.thumbnail_url;

            if (thumbnailUrl) {
                replyContent = (
                    <RX.View style={ styles.replyImageContainer }>
                        <CachedImage
                            resizeMode={ 'cover' }
                            style={ styles.replyImage }
                            source={ EventUtils.mxcToHttp(thumbnailUrl, ApiClient.credentials.homeServer) }
                            mimeType={ this.props.replyEvent.content.info?.mimetype }
                            animated={ false }
                        />
                    </RX.View>
                );
            } else {
                replyContent = (
                    <RX.Text style={ styles.textReplyMessage } numberOfLines={ 1 } >
                        { this.props.replyEvent.content.body! }
                    </RX.Text>
                );
            }

        } else {
            const stripped = EventUtils.stripReplyMessage(this.props.replyEvent.content.body!);
            const strippedFlattened = EventUtils.flattenString(stripped);
            replyContent = (
                <RX.Text style={ styles.textReplyMessage } numberOfLines={ 1 } >
                    { strippedFlattened }
                </RX.Text>
            );
        }

        let cancelButton: ReactElement | undefined;
        if (this.props.onCancelButton) {
            cancelButton = (
                <RX.Button
                    style={ styles.cancelReply }
                    onPress={ this.props.onCancelButton }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    <IconSvg
                        source= { require('../resources/svg/plus.json') as SvgFile }
                        fillColor={ TILE_BACKGROUND }
                        height={ 12 }
                        width={ 12 }
                    />
                </RX.Button>
            )
        }

        return (
            <RX.View style={ styles.replyContainer }>
                <RX.Text style={ styles.textReplySender }>
                    { this.getUserDisplayName(this.props.replyEvent.senderId) }
                </RX.Text>
                { replyContent }
                { cancelButton }
            </RX.View>
        )
    }
}
