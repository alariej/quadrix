import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { TILE_BACKGROUND, BUTTON_UNREAD_TEXT, BUTTON_UNREAD_BACKGROUND, TILE_SYSTEM_TEXT, BORDER_RADIUS, SPACING, FONT_LARGE, FONT_NORMAL,
    AVATAR_SMALL_WIDTH, TILE_HEIGHT, AVATAR_MARGIN, TRANSPARENT_BACKGROUND, ICON_INFO_FILL, BUTTON_MODAL_TEXT }
    from '../ui';
import DataStore from '../stores/DataStore';
import { ComponentBase } from 'resub';
import utils from '../utils/Utils';
import ApiClient from '../matrix/ApiClient';
import { invitationWaiting, archived, invitationNotYetAccepted, encryptedMessage, jitsiStartedShort, image } from '../translations';
import UiStore from '../stores/UiStore';
import IconSvg, { SvgFile } from './IconSvg';
import { StyleRuleSet, TextStyle } from 'reactxp/dist/common/Types';
import { RoomPhase, RoomType } from '../models/MatrixApi';
import { MessageEvent } from '../models/MessageEvent';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
        backgroundColor: TRANSPARENT_BACKGROUND,
    }),
    containerTile: RX.Styles.createViewStyle({
        flex: 1,
        flexDirection: 'row',
        backgroundColor: TILE_BACKGROUND,
        borderRadius: BORDER_RADIUS,
        marginBottom: SPACING,
        padding: SPACING,
        height: TILE_HEIGHT,
        cursor: 'pointer',
        alignItems: 'center',
    }),
    containerAvatar: RX.Styles.createViewStyle({
        justifyContent: 'center',
        alignItems: 'center',
        width: AVATAR_SMALL_WIDTH,
        height: AVATAR_SMALL_WIDTH,
        borderRadius: AVATAR_SMALL_WIDTH / 2,
        marginRight: AVATAR_MARGIN,
    }),
    avatar: RX.Styles.createImageStyle({
        flex: 1,
        width: AVATAR_SMALL_WIDTH,
        borderRadius: AVATAR_SMALL_WIDTH / 2,
    }),
    containerText: RX.Styles.createViewStyle({
        flex: 1,
        flexDirection: 'column',
    }),
    containerNewestMessage: RX.Styles.createViewStyle({
        flexDirection: 'row',
        height: FONT_LARGE + 4,
        alignItems: 'center',
    }),
    newestMessageText:  RX.Styles.createTextStyle({
        flex: 1,
        fontSize: FONT_LARGE,
        lineHeight: FONT_LARGE + 4,
        color: TILE_SYSTEM_TEXT,
    }),
    containerRoomName: RX.Styles.createTextStyle({
        marginBottom: SPACING,
        height: FONT_LARGE + 4,
        alignItems: 'center',
    }),
    roomName: RX.Styles.createTextStyle({
        fontSize: FONT_LARGE,
        fontWeight: 'bold',
    }),
    alias: RX.Styles.createTextStyle({
        fontSize: FONT_NORMAL,
    }),
    unreadNumber: RX.Styles.createTextStyle({
        height: 24,
        width: 24,
        marginLeft: 8,
        borderRadius: 12,
        backgroundColor: BUTTON_UNREAD_BACKGROUND,
        fontSize: FONT_LARGE,
        color: BUTTON_UNREAD_TEXT,
        textAlign: 'center',
    }),
};

interface RoomTileProps extends RX.CommonProps {
    onPressRoom?: (roomId: string) => void;
    roomId: string;
    newestRoomEvent?: MessageEvent;
    nonShadeable?: boolean;
}

interface RoomTileState {
    avatarUrl: string;
    name: string;
    unreadCount: number;
    phase: RoomPhase;
    contactPhase: RoomPhase | undefined,
    contactId: string,
    type: RoomType;
    appColor: string;
    isSelected: boolean;
    isShaded: boolean;
}

export default class RoomTile extends ComponentBase<RoomTileProps, RoomTileState> {

    private alias = '';
    private unreadTextStyle: StyleRuleSet<TextStyle> | undefined;

    constructor(props: RoomTileProps) {
        super(props);

        if (UiStore.getPlatform() !== 'android') {
            this.unreadTextStyle = RX.Styles.createTextStyle({
                lineHeight: 24,
            }, false);
        }
    }

    protected _buildState(_props: RoomTileProps, initState: boolean): RoomTileState | undefined {

        const roomSummary = DataStore.getRoomSummary(this.props.roomId);

        if (!roomSummary) { return; }

        if (initState) {
            this.alias = roomSummary.alias!;
        }

        let contactPhase: RoomPhase | undefined;
        if (roomSummary.type === 'direct' && roomSummary.contactId && roomSummary.members[roomSummary.contactId]) {

            contactPhase = roomSummary.members[roomSummary.contactId].membership;
        }

        const selectedRoom = UiStore.getSelectedRoom();

        return {
            avatarUrl: utils.mxcToHttp(roomSummary.avatarUrl!, ApiClient.credentials.homeServer),
            name: roomSummary.name!,
            unreadCount: roomSummary.unreadCount,
            phase: roomSummary.phase,
            contactPhase: contactPhase,
            contactId: roomSummary.contactId!,
            type: roomSummary.type!,
            isSelected: selectedRoom === this.props.roomId,
            isShaded: (selectedRoom && selectedRoom !== this.props.roomId) as boolean,
            appColor: UiStore.getAppColor(),
        };
    }

    public render(): JSX.Element | null {

        if (!this.state.type) { return null; }

        let unread: ReactElement | undefined;
        if (this.state.unreadCount !== undefined && this.state.unreadCount > 0 && !this.state.isSelected) {
            unread = (
                <RX.Text style={ [styles.unreadNumber, this.unreadTextStyle] }>
                    { this.state.unreadCount > 9 ? '9+' : this.state.unreadCount }
                </RX.Text>
            );
        }

        const avatarIsUrl = this.state.avatarUrl && this.state.avatarUrl.includes('https');

        let avatar: ReactElement;
        if (!this.state.avatarUrl) {
            if (this.state.type === 'direct') {
                avatar = (
                    <IconSvg
                        source= { require('../resources/svg/contact.json') as SvgFile }
                        fillColor={ BUTTON_MODAL_TEXT }
                        height={ AVATAR_SMALL_WIDTH * 0.5 }
                        width={ AVATAR_SMALL_WIDTH * 0.5 }
                    />
                )
            } else if (this.state.type === 'notepad') {
                avatar = (
                    <IconSvg
                        source= { require('../resources/svg/notepad.json') as SvgFile }
                        fillColor={ BUTTON_MODAL_TEXT }
                        height={ AVATAR_SMALL_WIDTH * 0.6 }
                        width={ AVATAR_SMALL_WIDTH * 0.6 }
                        style={{ marginLeft: AVATAR_SMALL_WIDTH / 14, marginBottom: AVATAR_SMALL_WIDTH / 14 }}
                    />
                )
            } else if (this.state.type === 'group') {
                avatar = (
                    <IconSvg
                        source= { require('../resources/svg/group.json') as SvgFile }
                        fillColor={ BUTTON_MODAL_TEXT }
                        height={ AVATAR_SMALL_WIDTH * 0.7 }
                        width={ AVATAR_SMALL_WIDTH * 0.7 }
                    />
                )
            } else if (this.state.type === 'community') {
                avatar = (
                    <IconSvg
                        source= { require('../resources/svg/community.json') as SvgFile }
                        fillColor={ BUTTON_MODAL_TEXT }
                        height={ AVATAR_SMALL_WIDTH * 0.6 }
                        width={ AVATAR_SMALL_WIDTH * 0.6 }
                    />
                )
            }
        } else if (avatarIsUrl) {
            avatar = (
                <RX.Image
                    resizeMode={ 'cover' }
                    style={ styles.avatar }
                    source={ this.state.avatarUrl }
                />
            )
        }

        let messageTypeIcon: ReactElement | undefined;
        let messageText: string | undefined;

        if (this.state.phase === 'invite') {
            messageText = invitationWaiting[UiStore.getLanguage()];
            messageTypeIcon = (
                <IconSvg
                    source= { require('../resources/svg/info.json') as SvgFile }
                    style={ { marginRight: SPACING } }
                    fillColor={ ICON_INFO_FILL }
                    height={ 16 }
                    width={ 16 }
                />
            );
        } else if (this.state.contactPhase === 'leave') {
            messageText = archived[UiStore.getLanguage()];
            messageTypeIcon = (
                <IconSvg
                    source= { require('../resources/svg/info.json') as SvgFile }
                    style={ { marginRight: SPACING } }
                    fillColor={ ICON_INFO_FILL }
                    height={ 16 }
                    width={ 16 }
                />
            );
        } else if (this.state.contactPhase === 'invite') {
            messageText = invitationNotYetAccepted[UiStore.getLanguage()];
            messageTypeIcon = (
                <IconSvg
                    source= { require('../resources/svg/info.json') as SvgFile }
                    style={ { marginRight: SPACING } }
                    fillColor={ ICON_INFO_FILL }
                    height={ 16 }
                    width={ 16 }
                />
            );
        } else if (this.props.newestRoomEvent) {

            if (this.props.newestRoomEvent.type === 'm.room.message') {

                if (this.props.newestRoomEvent.content.msgtype === 'm.file') {

                    messageText = this.props.newestRoomEvent.content.body;
                    messageTypeIcon = (
                        <IconSvg
                            source= { require('../resources/svg/document.json') as SvgFile }
                            style={ { marginRight: SPACING } }
                            fillColor={ ICON_INFO_FILL }
                            height={ 16 }
                            width={ 16 }
                        />
                    );
                } else if (this.props.newestRoomEvent.content.msgtype === 'm.image') {

                    messageText = image[UiStore.getLanguage()];

                    messageTypeIcon = (
                        <IconSvg
                            source= { require('../resources/svg/image.json') as SvgFile }
                            style={ { marginRight: SPACING } }
                            fillColor={ ICON_INFO_FILL }
                            height={ 16 }
                            width={ 16 }
                        />
                    );
                } else if (this.props.newestRoomEvent.content.body) {

                    if (this.props.newestRoomEvent.content.jitsi_started) {

                        messageText = jitsiStartedShort[UiStore.getLanguage()];

                        messageTypeIcon = (
                            <IconSvg
                                source= { require('../resources/svg/video.json') as SvgFile }
                                style={ { marginRight: SPACING } }
                                fillColor={ ICON_INFO_FILL }
                                height={ 16 }
                                width={ 16 }
                            />
                        );

                    } else {

                        // check for last carriage return, used among other things in reply-to messages
                        const lastCR = this.props.newestRoomEvent.content.body.lastIndexOf('\n');

                        if (lastCR > 0) {

                            messageText = this.props.newestRoomEvent.content.body.substr(lastCR + 1);

                        } else {

                            messageText = this.props.newestRoomEvent.content.body;
                        }
                    }
                }

            } else if (this.props.newestRoomEvent.type === 'm.room.encrypted') {

                messageText = encryptedMessage[UiStore.getLanguage()];
                messageTypeIcon = (
                    <IconSvg
                        source= { require('../resources/svg/info.json') as SvgFile }
                        style={ { marginRight: SPACING } }
                        fillColor={ ICON_INFO_FILL }
                        height={ 16 }
                        width={ 16 }
                    />
                );

            } else {

                messageText = utils.getSystemMessage(this.props.newestRoomEvent, this.state.type);
            }
        }

        let alias: ReactElement | undefined;
        if (this.alias && this.state.type === 'community' && this.state.name !== this.alias) {
            alias = (
                <RX.Text numberOfLines={ 1 } style={ styles.alias }>
                    { '  ' + this.alias }
                </RX.Text>
            );
        } else if (this.state.type === 'direct' && this.state.name !== this.state.contactId) {
            alias = (
                <RX.Text numberOfLines={ 1 } style={ styles.alias }>
                    { '  ' + this.state.contactId }
                </RX.Text>
            );
        }

        const messageRender = (
            <RX.Text
                key={ 'text' }
                style={ styles.newestMessageText }
                numberOfLines={ 1 }
            >
                { messageText }
            </RX.Text>
        );

        let shade;
        if (!this.props.nonShadeable && this.state.isShaded) {
            shade = (
                <RX.View style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    backgroundColor: this.state.appColor,
                    opacity: 0.5,
                    borderRadius: BORDER_RADIUS,
                }}/>
            )
        }

        return (
            <RX.View
                style={ styles.container }
            >
                <RX.View
                    style={ styles.containerTile }
                    onPress={ () => this.props.onPressRoom!(this.props.roomId) }
                    disableTouchOpacityAnimation={ false }
                    activeOpacity={ 0.8 }
                >
                    <RX.View style={ styles.containerAvatar }>
                        { avatar! }
                    </RX.View>
                    <RX.View style={ styles.containerText }>
                        <RX.Text numberOfLines={ 1 } style={ styles.containerRoomName }>
                            <RX.Text numberOfLines={ 1 } style={ styles.roomName }>
                                { this.state.name }
                            </RX.Text>
                            { alias }
                        </RX.Text>
                        <RX.View style={ styles.containerNewestMessage }>
                            { messageTypeIcon }
                            { messageRender }
                        </RX.View>
                    </RX.View>
                    { unread }
                    { shade }
                </RX.View>
            </RX.View>
        );
    }
}
