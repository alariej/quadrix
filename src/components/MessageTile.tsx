import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { TILE_BACKGROUND, FOOTER_TEXT, BORDER_RADIUS, SPACING, FONT_NORMAL, TILE_SYSTEM_TEXT, BUTTON_ROUND_WIDTH,
    TRANSPARENT_BACKGROUND, MARKER_READ_FILL, MARKER_SENT_FILL } from '../ui';
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
import Loading from '../modules/Loading';

const styles = {
    container: RX.Styles.createViewStyle({
        backgroundColor: TRANSPARENT_BACKGROUND,
    }),
    containerTile: RX.Styles.createViewStyle({
        backgroundColor: TILE_BACKGROUND,
        borderRadius: BORDER_RADIUS,
        marginBottom: SPACING,
        padding: SPACING,
    }),
    containerMessage: RX.Styles.createViewStyle({
        overflow: 'visible',
    }),
    containerFooter: RX.Styles.createViewStyle({
        flexDirection: 'row',
        marginTop: 8,
        height: 16,
    }),
    footer: RX.Styles.createViewStyle({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    }),
    footerSenderId: RX.Styles.createTextStyle({
        flexShrink: 1,
        fontSize: FONT_NORMAL,
        color: FOOTER_TEXT,
    }),
    footerTimestamp: RX.Styles.createTextStyle({
        flexShrink: 0,
        fontSize: FONT_NORMAL,
        color: FOOTER_TEXT,
    }),
    containerMarker: RX.Styles.createViewStyle({
        flex: 1,
    }),
    spinner: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'flex-end',
        marginRight: SPACING
    }),
    containerText: RX.Styles.createTextStyle({
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

        let marginFactor;

        if (this.props.roomType === 'notepad') {
            marginFactor = 0.5;
        } else {
            marginFactor = this.props.event.senderId === ApiClient.credentials.userIdFull ? 1 : 0;
        }

        this.marginStyle = RX.Styles.createViewStyle({
            marginLeft: (BUTTON_ROUND_WIDTH + SPACING) * marginFactor,
            marginRight: (BUTTON_ROUND_WIDTH + SPACING) * (1 - marginFactor),
        }, false);

        let message;

        if (this.props.isRedacted) {

            message = (
                <RX.Text style={ styles.containerText}>
                    { messageDeleted[UiStore.getLanguage()] }
                </RX.Text>
            );
        } else if (this.props.event.type === 'm.room.encrypted') {

            message = (
                <RX.Text style={ styles.containerText}>
                    { encryptedMessage[UiStore.getLanguage()] }
                </RX.Text>
            );
        } else if (this.props.event.content.msgtype === 'm.image') {

            message = (
                <ImageMessage
                    roomId={ this.props.roomId }
                    message={ this.props.event }
                    showContextDialog={ this.showContextDialog }
                />
            );
        } else if (this.props.event.content.msgtype === 'm.file') {

            message = (
                <FileMessage
                    message={ this.props.event }
                    showContextDialog={ this.showContextDialog }
                />
            );
        } else {

            message = (
                <TextMessage
                    roomId={ this.props.roomId }
                    message={ this.props.event }
                    showContextDialog={ this.showContextDialog }
                />
            );
        }

        const timestamp = format(this.props.event.time, 'HH:mm');

        let footer: ReactElement;
        if (this.props.roomType !== 'direct' && ApiClient.credentials.userIdFull !== this.props.event.senderId) {
            footer = (
                <RX.View style={ styles.footer } title={ this.props.event.senderId + ' - ' + timestamp }>
                    <RX.Text style={ styles.footerSenderId } numberOfLines={ 1 }>
                        { this.props.event.senderId }
                    </RX.Text>
                    <RX.Text style={ styles.footerTimestamp } numberOfLines={ 1 }>
                        {  ' - ' + timestamp }
                    </RX.Text>
                </RX.View>
            );
        } else {
            footer = (
                <RX.Text style={ styles.footerTimestamp }>
                    { timestamp }
                </RX.Text>
            );
        }

        let readMarker: ReactElement | null = null;
        if (this.props.roomType !== 'notepad' && ApiClient.credentials.userIdFull === this.props.event.senderId) {

            if (this.props.readMarkerType === 'read') {
                readMarker = (
                    <RX.View style={ styles.containerMarker }>
                        <IconSvg
                            source= { require('../resources/svg/marker.json') as SvgFile }
                            fillColor={ MARKER_READ_FILL }
                            height={ 11 }
                            width={ 11 }
                            style={ { alignSelf: 'flex-end' }}
                        />
                    </RX.View>
                );
            } else if (this.props.readMarkerType === 'sent') {
                readMarker = (
                    <RX.View style={ styles.containerMarker }>
                        <IconSvg
                            source= { require('../resources/svg/marker.json') as SvgFile }
                            fillColor={ MARKER_SENT_FILL }
                            height={ 11 }
                            width={ 11 }
                            style={ { alignSelf: 'flex-end' }}
                        />
                    </RX.View>
                );
            } else if (this.props.readMarkerType === 'sending') {
                readMarker = (
                    <RX.View style={ styles.containerMarker }>
                        <RX.View style={ styles.spinner }>
                            <Loading size={ 'small' } color={ MARKER_SENT_FILL } isVisible={ true } />
                        </RX.View>
                    </RX.View>
                );
            }
        }

        let messageWrapper;

        if (UiStore.getPlatform() === 'web' && UiStore.getDevice() === 'mobile') {

            messageWrapper = (
                <RX.GestureView
                    style={ [styles.containerTile, this.marginStyle] }
                    onLongPress={ this.showContextDialog }
                    onPan={ () => null }
                >
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
