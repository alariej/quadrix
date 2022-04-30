import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { TILE_BACKGROUND, BUTTON_UNREAD_TEXT, BUTTON_UNREAD_BACKGROUND, TILE_SYSTEM_TEXT, BORDER_RADIUS, SPACING, FONT_LARGE, FONT_NORMAL,
    AVATAR_SMALL_WIDTH, TILE_HEIGHT, TRANSPARENT_BACKGROUND, ICON_INFO_FILL, TILE_MESSAGE_TEXT, AVATAR_FOREGROUND,
    TILE_BACKGROUND_SELECTED }
    from '../ui';
import DataStore from '../stores/DataStore';
import { ComponentBase } from 'resub';
import EventUtils from '../utils/EventUtils';
import ApiClient from '../matrix/ApiClient';
import { invitationWaiting, archived, invitationNotYetAccepted, encryptedMessage, jitsiStartedShort, image, video, yesterdayWord,
    Languages } from '../translations';
import UiStore from '../stores/UiStore';
import IconSvg, { SvgFile } from './IconSvg';
import { StyleRuleSet, TextStyle } from 'reactxp/dist/common/Types';
import { RoomPhase, RoomType } from '../models/MatrixApi';
import { MessageEvent } from '../models/MessageEvent';
import AppFont from '../modules/AppFont';
import CachedImage from '../modules/CachedImage';
import { format, isSameWeek, isToday, isYesterday, Locale } from 'date-fns';
import StringUtils from '../utils/StringUtils';
import { RoomSummary } from '../models/RoomSummary';
import { User } from '../models/User';

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
        borderWidth: 1,
        borderColor: TILE_BACKGROUND,
        marginBottom: 1,
        padding: 2 * SPACING,
        height: TILE_HEIGHT,
        cursor: 'pointer',
        alignItems: 'center',
    }),
    containerAvatar: RX.Styles.createViewStyle({
        justifyContent: 'center',
        alignItems: 'center',
        width: AVATAR_SMALL_WIDTH,
        height: AVATAR_SMALL_WIDTH,
    }),
    avatar: RX.Styles.createImageStyle({
        flex: 1,
        width: AVATAR_SMALL_WIDTH,
        height: AVATAR_SMALL_WIDTH,
        borderRadius: AVATAR_SMALL_WIDTH / 2,
    }),
    containerRoomInfo: RX.Styles.createViewStyle({
        flex: 1,
        paddingLeft: 2 * SPACING,
    }),
    containerRoomName: RX.Styles.createTextStyle({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        maxHeight: FONT_LARGE + 4,
        marginBottom: SPACING,
    }),
    roomName: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_LARGE,
        color: TILE_MESSAGE_TEXT,
        fontWeight: 'bold',
    }),
    alias: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_NORMAL,
        color: TILE_MESSAGE_TEXT,
    }),
    containerNewestMessage: RX.Styles.createViewStyle({
        flexDirection: 'row',
        alignItems: 'flex-end',
        maxHeight: FONT_LARGE + 4,
    }),
    newestMessageText:  RX.Styles.createTextStyle({
        flex: 1,
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_LARGE,
        color: TILE_SYSTEM_TEXT,
    }),
    unreadNumber: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        height: 24,
        width: 24,
        borderRadius: 12,
        backgroundColor: BUTTON_UNREAD_BACKGROUND,
        fontSize: FONT_LARGE,
        color: BUTTON_UNREAD_TEXT,
        textAlign: 'center',
        marginLeft: 2 * SPACING,
    }),
    messageTime: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_NORMAL,
        color: TILE_SYSTEM_TEXT,
        textAlign: 'center',
        marginLeft: 2 * SPACING,
    }),
};

interface RoomTileProps extends RX.CommonProps {
    onPressRoom?: (roomId: string) => void;
    roomId: string;
    newestRoomEvent?: MessageEvent;
}

interface RoomTileState {
    avatarUrl: string;
    name: string;
    unreadCount: number;
    phase: RoomPhase;
    contactPhase: RoomPhase | undefined,
    contactId: string,
    type: RoomType;
    isSelected: boolean;
    isJitsiMaximised: boolean;
}

export default class RoomTile extends ComponentBase<RoomTileProps, RoomTileState> {

    private alias = '';
    private unreadTextStyle: StyleRuleSet<TextStyle> | undefined;
    private language: Languages;
    private locale: Locale;

    constructor(props: RoomTileProps) {
        super(props);

        if (UiStore.getPlatform() !== 'android') {
            this.unreadTextStyle = RX.Styles.createTextStyle({
                lineHeight: 24,
            }, false);
        }

        this.language = UiStore.getLanguage();
        this.locale = UiStore.getLocale();
    }

    protected _buildState(props: RoomTileProps, initState: boolean): RoomTileState | undefined {

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

        let avatarUrl: string | undefined;
        let name: string | undefined;
        if (roomSummary.type === 'direct') {
            name = roomSummary.members[roomSummary.contactId!].name;
            avatarUrl = roomSummary.members[roomSummary.contactId!].avatarUrl;
        } else {
            name = roomSummary.name;
            avatarUrl = roomSummary.avatarUrl;
        }

        if (initState && roomSummary.type !== 'community') {

            const n = Object.keys(roomSummary.members).length;
            const m = (roomSummary.joinMembersCount || 0) + (roomSummary.inviteMembersCount || 0);

            const nameMissing = Object.keys(roomSummary.members).some(member => {
                return roomSummary.members[member].name === undefined;
            });

            if (n !== m || nameMissing) {
                this.getRoomMembersFromServer(props.roomId, roomSummary);
            }
        }

        return {
            avatarUrl: StringUtils.mxcToHttp(avatarUrl!, ApiClient.credentials.homeServer),
            name: name!,
            unreadCount: roomSummary.unreadCount,
            phase: roomSummary.phase,
            contactPhase: contactPhase,
            contactId: roomSummary.contactId!,
            type: roomSummary.type!,
            isSelected: selectedRoom === this.props.roomId,
            isJitsiMaximised: UiStore.getJitsiMaximised(),
        };
    }

    private getRoomMembersFromServer = (roomId: string, roomSummary: RoomSummary) => {

        ApiClient.getRoomMembers(roomId, false)
            .then(members => {

                const members_: { [id: string]: User } = {};
                for (const member of Object.values(members)) {
                    members_[member.id] = {
                        ...member,
                        powerLevel: roomSummary.members[member.id]?.powerLevel || undefined,
                    }
                }

                DataStore.addMembers(roomId, members_);
            })
            .catch(_error => null);
    }

    public render(): JSX.Element | null {

        if (!this.state.type) { return null; }

        let unread: ReactElement | undefined;
        let messageTime: ReactElement | undefined;
        if (this.state.unreadCount !== undefined && this.state.unreadCount > 0) {
            unread = (
                <RX.Text allowFontScaling={ false } style={ [styles.unreadNumber, this.unreadTextStyle] }>
                    { this.state.unreadCount > 9 ? '9+' : this.state.unreadCount }
                </RX.Text>
            );
        } else if (this.props.newestRoomEvent?.time) {

            let messageTimeString: string;
            if (isToday(this.props.newestRoomEvent.time)) {
                messageTimeString = format(this.props.newestRoomEvent.time, 'HH:mm');
            } else if (isYesterday(this.props.newestRoomEvent.time)) {
                messageTimeString = yesterdayWord[this.language];
            } else if (isSameWeek(new Date(), this.props.newestRoomEvent.time)){
                messageTimeString = format(this.props.newestRoomEvent.time, 'EEEE', { locale: this.locale });
            } else {
                messageTimeString = format(this.props.newestRoomEvent.time, 'd MMM', { locale: this.locale });
            }

            messageTime = (
                <RX.Text allowFontScaling={ false } style={ styles.messageTime }>
                    { messageTimeString }
                </RX.Text>
            )
        }

        const avatarIsUrl = this.state.avatarUrl && this.state.avatarUrl.includes('https');

        let avatar: ReactElement;
        if (!this.state.avatarUrl) {
            if (this.state.type === 'direct') {
                avatar = (
                    <IconSvg
                        source= { require('../resources/svg/contact.json') as SvgFile }
                        fillColor={ AVATAR_FOREGROUND }
                        height={ AVATAR_SMALL_WIDTH * 0.5 }
                        width={ AVATAR_SMALL_WIDTH * 0.5 }
                    />
                )
            } else if (this.state.type === 'notepad') {
                avatar = (
                    <IconSvg
                        source= { require('../resources/svg/notepad.json') as SvgFile }
                        fillColor={ AVATAR_FOREGROUND }
                        height={ AVATAR_SMALL_WIDTH * 0.6 }
                        width={ AVATAR_SMALL_WIDTH * 0.6 }
                        style={{ marginLeft: AVATAR_SMALL_WIDTH / 14, marginBottom: AVATAR_SMALL_WIDTH / 14 }}
                    />
                )
            } else if (this.state.type === 'group') {
                avatar = (
                    <IconSvg
                        source= { require('../resources/svg/group.json') as SvgFile }
                        fillColor={ AVATAR_FOREGROUND }
                        height={ AVATAR_SMALL_WIDTH * 0.7 }
                        width={ AVATAR_SMALL_WIDTH * 0.7 }
                    />
                )
            } else if (this.state.type === 'community') {
                avatar = (
                    <IconSvg
                        source= { require('../resources/svg/community.json') as SvgFile }
                        fillColor={ AVATAR_FOREGROUND }
                        height={ AVATAR_SMALL_WIDTH * 0.6 }
                        width={ AVATAR_SMALL_WIDTH * 0.6 }
                    />
                )
            }
        } else if (avatarIsUrl) {
            avatar = (
                <CachedImage
                    resizeMode={ 'cover' }
                    style={ styles.avatar }
                    source={ this.state.avatarUrl }
                />
            )
        }

        let messageTypeIcon: ReactElement | undefined;
        let messageText: string | undefined;

        if (this.state.phase === 'invite') {
            messageText = invitationWaiting[this.language];
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
            messageText = archived[this.language];
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
            messageText = invitationNotYetAccepted[this.language];
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

                    messageText = image[this.language];

                    messageTypeIcon = (
                        <IconSvg
                            source= { require('../resources/svg/image.json') as SvgFile }
                            style={ { marginRight: SPACING } }
                            fillColor={ ICON_INFO_FILL }
                            height={ 16 }
                            width={ 16 }
                        />
                    );
                } else if (this.props.newestRoomEvent.content.msgtype === 'm.video') {

                    messageText = video[this.language];

                    messageTypeIcon = (
                        <IconSvg
                            source= { require('../resources/svg/video_media.json') as SvgFile }
                            style={ { marginRight: SPACING } }
                            fillColor={ ICON_INFO_FILL }
                            height={ 16 }
                            width={ 16 }
                        />
                    );
                } else if (this.props.newestRoomEvent.content.body) {

                    if (this.props.newestRoomEvent.content.jitsi_started) {

                        messageText = jitsiStartedShort[this.language];

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

                        const stripped = StringUtils.stripReplyMessage(this.props.newestRoomEvent.content.body);
                        messageText = StringUtils.flattenString(stripped);
                    }
                }

            } else if (this.props.newestRoomEvent.type === 'm.room.encrypted') {

                messageText = encryptedMessage[this.language];
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

                messageText = EventUtils.getSystemMessage(this.props.newestRoomEvent, this.state.type);
            }
        }

        let alias: ReactElement | undefined;
        if (this.alias && this.state.type === 'community' && this.state.name !== this.alias) {
            alias = (
                <RX.Text style={ styles.alias } allowFontScaling={ false } numberOfLines={ 1 }>
                    { ' ' + this.alias }
                </RX.Text>
            );
        } else if (this.state.type === 'direct' && this.state.name !== this.state.contactId) {
            alias = (
                <RX.Text style={ styles.alias } allowFontScaling={ false } numberOfLines={ 1 }>
                    { ' ' + this.state.contactId }
                </RX.Text>
            );
        }

        const messageRender = (
            <RX.Text allowFontScaling={ false } numberOfLines={ 1 } style={ styles.newestMessageText }>
                { messageText }
            </RX.Text>
        );

        return (
            <RX.View
                style={ styles.container }
            >
                <RX.View
                    style={[
                        styles.containerTile,
                        { backgroundColor: this.state.isSelected ? TILE_BACKGROUND_SELECTED : TILE_BACKGROUND }
                    ]}
                    onPress={ () => this.state.isJitsiMaximised ? null : this.props.onPressRoom!(this.props.roomId) }
                    disableTouchOpacityAnimation={ false }
                    activeOpacity={ 0.8 }
                >
                    <RX.View style={ styles.containerAvatar }>
                        { avatar! }
                    </RX.View>
                    <RX.View style={ styles.containerRoomInfo }>
                        <RX.Text style={ styles.containerRoomName } allowFontScaling={ false } numberOfLines={ 1 }>
                            <RX.Text style={ styles.roomName } allowFontScaling={ false } numberOfLines={ 1 }>
                                { this.state.name }
                            </RX.Text>
                            { alias }
                        </RX.Text>
                        <RX.View style={ styles.containerNewestMessage }>
                            { messageTypeIcon }
                            { messageRender }
                            { messageTime }
                        </RX.View>
                    </RX.View>
                    { unread }
                </RX.View>
            </RX.View>
        );
    }
}
