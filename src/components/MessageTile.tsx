import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { TILE_BACKGROUND, FOOTER_TEXT, BORDER_RADIUS, SPACING, FONT_NORMAL, TILE_SYSTEM_TEXT, BUTTON_ROUND_WIDTH,
    TRANSPARENT_BACKGROUND, MARKER_READ_FILL, MARKER_SENT_FILL, FONT_LARGE, TILE_BACKGROUND_OWN } from '../ui';
import ImageMessage from './ImageMessage';
import FileMessage from './FileMessage';
import TextMessage from './TextMessage';
import ApiClient from '../matrix/ApiClient';
import { MessageEvent, TemporaryMessage } from '../models/MessageEvent';
import DialogMessageTile from '../dialogs/DialogMessageTile';
import { encryptedMessage, messageDeleted } from '../translations';
import UiStore from '../stores/UiStore';
import IconSvg, { SvgFile } from './IconSvg';
import { format } from 'date-fns';
import { RoomType } from '../models/MatrixApi';
import Spinner from './Spinner';
import AppFont from '../modules/AppFont';
import VideoMessage from './VideoMessage';

const styles = {
    container: RX.Styles.createViewStyle({
        backgroundColor: TRANSPARENT_BACKGROUND,
    }),
    containerTile: RX.Styles.createViewStyle({
        borderRadius: BORDER_RADIUS,
        marginBottom: SPACING,
        padding: SPACING,
        overflow: 'visible'
    }),
    containerMessage: RX.Styles.createViewStyle({
        overflow: 'visible',
    }),
    containerFooter: RX.Styles.createViewStyle({
        flexDirection: 'row',
        marginTop: 8,
        height: 16,
        overflow: 'visible'
    }),
    footer: RX.Styles.createViewStyle({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    }),
    footerSenderId: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        flexShrink: 1,
        fontSize: FONT_NORMAL,
        color: FOOTER_TEXT,
    }),
    footerTimestamp: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        flexShrink: 0,
        fontSize: FONT_NORMAL,
        color: FOOTER_TEXT,
    }),
    containerMarker: RX.Styles.createViewStyle({
        flex: 1,
        overflow: 'visible'
    }),
    spinner: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'flex-end',
        marginRight: SPACING,
        overflow: 'visible'
    }),
    containerText: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        flex: 1,
        fontSize: FONT_NORMAL,
        minHeight: FONT_NORMAL + 7,
        color: TILE_SYSTEM_TEXT,
    }),
};

interface MessageTileProps {
    roomId: string;
    event: MessageEvent;
    roomType: RoomType;
    readMarkerType?: string;
    setReplyMessage?: (message: TemporaryMessage) => void;
    showTempForwardedMessage?: (roomId: string, message?: MessageEvent, tempId?: string) => void;
    canPress?: boolean;
    isRedacted: boolean;
}

export default class MessageTile extends RX.Component<MessageTileProps, RX.Stateless> {

    private mainTile: RX.View | undefined;
    private marginStyle: RX.Types.ViewStyleRuleSet;

    public shouldComponentUpdate(nextProps: MessageTileProps): boolean {

        return this.props.readMarkerType !== nextProps.readMarkerType ||
            this.props.isRedacted !== nextProps.isRedacted;
    }

    private showContextDialog = () => {

        RX.UserInterface.dismissKeyboard();

        RX.UserInterface.measureLayoutRelativeToWindow(this.mainTile!)
            .then(layout => {

                const dialogMessageTile = (
                    <DialogMessageTile
                        roomId={ this.props.roomId }
                        event={ this.props.event }
                        layout={ layout }
                        roomType={ this.props.roomType }
                        readMarkerType={ this.props.readMarkerType }
                        setReplyMessage={ this.props.setReplyMessage }
                        showTempForwardedMessage={ this.props.showTempForwardedMessage }
                        marginStyle={ this.marginStyle }
                    />
                );

                RX.Modal.show(dialogMessageTile, 'dialogMessageTile');
            })
            .catch(_error => null);
    }

    public render(): JSX.Element | null {

        let message;
        let messageType: string;

        if (this.props.isRedacted) {

            messageType = 'system';

            message = (
                <RX.Text style={ styles.containerText}>
                    { messageDeleted[UiStore.getLanguage()] }
                </RX.Text>
            );
        } else if (this.props.event.type === 'm.room.encrypted') {

            messageType = 'system';

            message = (
                <RX.Text style={ styles.containerText}>
                    { encryptedMessage[UiStore.getLanguage()] }
                </RX.Text>
            );
        } else if (this.props.event.content.msgtype === 'm.image') {

            messageType = 'media';

            message = (
                <ImageMessage
                    roomId={ this.props.roomId }
                    message={ this.props.event }
                    showContextDialog={ this.showContextDialog }
                />
            );
        } else if (this.props.event.content.msgtype === 'm.video') {

            messageType = 'media';

            message = (
                <VideoMessage
                    message={ this.props.event }
                    showContextDialog={ this.showContextDialog }
                />
            );
        } else if (this.props.event.content.msgtype === 'm.file') {

            messageType = 'media';

            message = (
                <FileMessage
                    message={ this.props.event }
                    showContextDialog={ this.showContextDialog }
                />
            );
        } else {

            messageType = 'text';

            message = (
                <TextMessage
                    roomId={ this.props.roomId }
                    message={ this.props.event }
                    showContextDialog={ this.showContextDialog }
                />
            );
        }

        const isOwnMessage = this.props.event.senderId === ApiClient.credentials.userIdFull;
        let marginFactor;

        if (this.props.roomType === 'notepad') {
            marginFactor = 0.5;
        } else {
            marginFactor = this.props.event.senderId === ApiClient.credentials.userIdFull ? 1 : 0;
        }

        const marginMin = (BUTTON_ROUND_WIDTH + SPACING);
        let marginText = 0;

        if (messageType === 'text' && this.props.roomType !== 'notepad' && !this.props.event.content.url_preview) {
            const marginMax = 192;
            const margin = Math.min(marginMax, (48 - this.props.event.content.body!.length) * FONT_LARGE / 2);
            marginText = Math.max(marginMin, margin);
        }

        this.marginStyle = RX.Styles.createViewStyle({
            marginLeft: (marginText || marginMin) * marginFactor,
            marginRight: (marginText || marginMin) * (1 - marginFactor),
            backgroundColor: (isOwnMessage && this.props.roomType !== 'notepad') ? TILE_BACKGROUND_OWN : TILE_BACKGROUND,
        }, false);

        const timestamp = format(this.props.event.time, 'HH:mm');

        let footer: ReactElement;
        if (this.props.roomType !== 'direct' && ApiClient.credentials.userIdFull !== this.props.event.senderId) {
            footer = (
                <RX.View style={ styles.footer } title={ this.props.event.senderId + ' - ' + timestamp }>
                    <RX.Text allowFontScaling={ false } style={ styles.footerSenderId } numberOfLines={ 1 }>
                        { this.props.event.senderId }
                    </RX.Text>
                    <RX.Text allowFontScaling={ false } style={ styles.footerTimestamp } numberOfLines={ 1 }>
                        {  ' - ' + timestamp }
                    </RX.Text>
                </RX.View>
            );
        } else {
            footer = (
                <RX.Text allowFontScaling={ false } style={ styles.footerTimestamp }>
                    { timestamp }
                </RX.Text>
            );
        }

        let readMarker: ReactElement | null = null;
        if (ApiClient.credentials.userIdFull === this.props.event.senderId) {

            if (this.props.readMarkerType === 'read' && this.props.roomType !== 'notepad') {
                readMarker = (
                    <RX.View style={ styles.containerMarker }>
                        <IconSvg
                            source= { require('../resources/svg/marker.json') as SvgFile }
                            fillColor={ MARKER_READ_FILL }
                            height={ 14 }
                            width={ 14 }
                            style={ { alignSelf: 'flex-end' }}
                        />
                    </RX.View>
                );
            } else if (this.props.readMarkerType === 'sent' && this.props.roomType !== 'notepad') {
                readMarker = (
                    <RX.View style={ styles.containerMarker }>
                        <IconSvg
                            source= { require('../resources/svg/marker.json') as SvgFile }
                            fillColor={ MARKER_SENT_FILL }
                            height={ 14 }
                            width={ 14 }
                            style={ { alignSelf: 'flex-end' }}
                        />
                    </RX.View>
                );
            } else if (this.props.readMarkerType === 'sending') {
                readMarker = (
                    <RX.View style={ styles.containerMarker }>
                        <RX.View style={ styles.spinner }>
                            <Spinner size={ 'small' } color={ MARKER_SENT_FILL } isVisible={ true } />
                        </RX.View>
                    </RX.View>
                );
            }
        }

        let cornerPointer: ReactElement | undefined;

        if (['direct', 'group'].includes(this.props.roomType)) {
            cornerPointer = (
                <RX.View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: isOwnMessage ? -20 : undefined,
                        right: isOwnMessage ? undefined : -20,
                        height: 20,
                        width: 20 + BORDER_RADIUS,
                        overflow: 'hidden',
                    }}
                >
                    <RX.View
                        style={{
                            position: 'absolute',
                            bottom: -28,
                            left: isOwnMessage ? -120 / 2 : undefined,
                            right: isOwnMessage ? undefined : -120 / 2,
                            height: 100,
                            width: 100,
                            borderRadius: 100 / 2,
                            borderWidth: 20,
                            borderColor: isOwnMessage ? TILE_BACKGROUND_OWN : TILE_BACKGROUND,
                        }}
                    />
                </RX.View>
            )
        }

        let messageWrapper;

        if (UiStore.getPlatform() === 'web' && UiStore.getDevice() === 'mobile') {

            messageWrapper = (
                <RX.GestureView
                    style={ [styles.containerTile, this.marginStyle] }
                    onLongPress={ this.showContextDialog }
                    onPan={ () => null }
                >
                    { cornerPointer }
                    <RX.View style={ styles.containerMessage }>
                        { message }
                    </RX.View>
                    <RX.View style={ styles.containerFooter }>
                        { footer }
                        { readMarker }
                    </RX.View>
                </RX.GestureView>
            );

        } else {

            messageWrapper = (
                <RX.View
                    style={ [styles.containerTile, this.marginStyle] }
                    onPress={ () => RX.UserInterface.dismissKeyboard() }
                    onLongPress={ this.showContextDialog }
                    disableTouchOpacityAnimation={ true }
                    onContextMenu={ this.showContextDialog }
                    activeOpacity={ 1 }
                >
                    { cornerPointer }
                    <RX.View style={ styles.containerMessage }>
                        { message }
                    </RX.View>
                    <RX.View style={ styles.containerFooter }>
                        { footer }
                        { readMarker }
                    </RX.View>
                </RX.View>
            );
        }

        return (
            <RX.View
                style={ styles.container }
                onPress={ () => RX.UserInterface.dismissKeyboard() }
                ref={ component => this.mainTile = component! }
            >
                { messageWrapper }
            </RX.View>
        );
    }
}
