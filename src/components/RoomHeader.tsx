import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { BUTTON_ROUND_BACKGROUND, HEADER_TEXT, BUTTON_ROUND_WIDTH, BORDER_RADIUS, CONTAINER_PADDING, HEADER_HEIGHT,
    SPACING, FONT_NORMAL, FONT_LARGE, AVATAR_SMALL_WIDTH, ICON_REDUCTION_FACTOR, BUTTON_UNREAD_TEXT, BUTTON_UNREAD_BACKGROUND, FONT_SMALL,
    AVATAR_MARGIN, LOGO_BACKGROUND, AVATAR_BACKGROUND, BUTTON_MODAL_TEXT } from '../ui';
import { ComponentBase } from 'resub';
import DataStore from '../stores/DataStore';
import utils from '../utils/Utils';
import { User } from '../models/User';
import ApiClient from '../matrix/ApiClient';
import DialogAvatar from '../dialogs/DialogAvatar';
import DialogRoomHeader from '../dialogs/DialogRoomHeader';
import UiStore from '../stores/UiStore';
import { RoomSummary } from '../models/RoomSummary';
import { recentActivity, online, communityMembers, notepad, yesterdayWord, todayWord, Languages } from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import { differenceInDays, differenceInMilliseconds, format, isToday, isYesterday, Locale } from 'date-fns';
import { StyleRuleSet, TextStyle } from 'reactxp/dist/common/Types';
import { RoomPhase, RoomType } from '../models/MatrixApi';

const styles = {
    container: RX.Styles.createViewStyle({
        flexDirection: 'row',
        height: HEADER_HEIGHT,
        marginBottom: SPACING,
    }),
    containerRoomHeader: RX.Styles.createViewStyle({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: CONTAINER_PADDING,
        borderRadius: BORDER_RADIUS,
        cursor: 'pointer',
    }),
    containerAvatar: RX.Styles.createViewStyle({
        justifyContent: 'center',
        alignItems: 'center',
        width: AVATAR_SMALL_WIDTH,
        height: AVATAR_SMALL_WIDTH,
        borderRadius: AVATAR_SMALL_WIDTH / 2,
        marginRight: AVATAR_MARGIN,
        backgroundColor: AVATAR_BACKGROUND,
        cursor: 'pointer',
    }),
    avatar: RX.Styles.createImageStyle({
        flex: 1,
        width: AVATAR_SMALL_WIDTH,
        borderRadius: AVATAR_SMALL_WIDTH / 2,
        backgroundColor: AVATAR_BACKGROUND,
    }),
    containerRoomInfo: RX.Styles.createViewStyle({
        flex: 1,
    }),
    containerRoomName: RX.Styles.createTextStyle({
        marginBottom: 2,
        color: HEADER_TEXT,
    }),
    roomName: RX.Styles.createTextStyle({
        flex: 1,
        fontSize: FONT_LARGE,
        fontWeight: 'bold',
    }),
    alias: RX.Styles.createTextStyle({
        flex: 1,
        fontSize: FONT_NORMAL,
    }),
    subtitle: RX.Styles.createTextStyle({
        fontSize: FONT_NORMAL,
        color: HEADER_TEXT,
    }),
    containerHomeButton: RX.Styles.createViewStyle({
        width: BUTTON_ROUND_WIDTH,
        height: BUTTON_ROUND_WIDTH,
        marginLeft: SPACING,
        overflow: 'visible',
    }),
    roundButton: RX.Styles.createViewStyle({
        borderRadius: BUTTON_ROUND_WIDTH / 2,
        borderWidth: 1,
        borderColor: LOGO_BACKGROUND,
        width: BUTTON_ROUND_WIDTH,
        height: BUTTON_ROUND_WIDTH,
        backgroundColor: BUTTON_ROUND_BACKGROUND,
    }),
    containerIcon: RX.Styles.createViewStyle({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    unreadNumber: RX.Styles.createTextStyle({
        position: 'absolute',
        bottom: -8,
        right: 0,
        height: 18,
        width: 18,
        borderRadius: 9,
        backgroundColor: BUTTON_UNREAD_BACKGROUND,
        fontSize: FONT_SMALL,
        color: BUTTON_UNREAD_TEXT,
        textAlign: 'center',
    }),
};

interface RoomHeaderState {
    avatarUrl: string,
    name: string,
    type: RoomType,
    phase: RoomPhase,
    lastSeen: string,
    members: { [id: string]: User },
    contactId: string,
    totalUnreadCount: number,
}

interface RoomHeaderProps extends RX.CommonProps {
    showLogin: () => void,
    showRoomList: () => void,
    roomId: string,
}

export default class RoomHeader extends ComponentBase<RoomHeaderProps, RoomHeaderState> {

    private alias = '';
    private joinMembersCount = 0;
    private roomSummary!: RoomSummary;
    private language: Languages = 'en';
    private locale: Locale;
    private unreadTextStyle: StyleRuleSet<TextStyle> = undefined;

    constructor(props: RoomHeaderProps) {
        super(props);

        this.language = UiStore.getLanguage();
        this.locale = UiStore.getLocale();

        if (UiStore.getPlatform() !== 'android') {
            this.unreadTextStyle = RX.Styles.createTextStyle({
                lineHeight: 18,
            }, false);
        }
    }

    protected _buildState(nextProps: RoomHeaderProps, initState: boolean, prevState: RoomHeaderState): Partial<RoomHeaderState> {

        const partialState: Partial<RoomHeaderState> = {};

        if (UiStore.getUnknownAccessToken()) {
            this.doLogout().catch(_error => null);
            return partialState;
        }

        this.roomSummary = DataStore.getRoomSummary(nextProps.roomId);

        this.alias = this.roomSummary.alias!;
        this.joinMembersCount = this.roomSummary.joinMembersCount!;

        if (this.roomSummary.type !== 'community'
        && (initState || this.props.roomId !== nextProps.roomId || prevState.phase !== this.roomSummary.phase)) {

            this.getRoomMembersFromServer(nextProps.roomId);

            if (this.roomSummary.type === 'direct') {

                this.getContactPresence();

            } else {

                partialState.lastSeen = undefined;
            }
        }

        let roomMembers: { [id: string]: User };
        if (prevState && this.props.roomId === nextProps.roomId) {

            roomMembers = { ...prevState.members, ...this.roomSummary.members };

        } else {

            roomMembers = this.roomSummary.members;
        }

        if (!initState && this.roomSummary.type === 'direct') {

            const lastSeenTime = DataStore.getLastSeenTime(this.roomSummary.contactId!);

            partialState.lastSeen = this.getLastSeen(lastSeenTime);

        } else {

            partialState.lastSeen = undefined;
        }

        partialState.avatarUrl = utils.mxcToHttp(this.roomSummary.avatarUrl!, ApiClient.credentials.homeServer);
        partialState.name = this.roomSummary.name;
        partialState.type = this.roomSummary.type;
        partialState.phase = this.roomSummary.phase;
        partialState.members = roomMembers;
        partialState.contactId = this.roomSummary.contactId;
        partialState.totalUnreadCount = DataStore.getUnreadTotal(nextProps.roomId);

        return partialState;
    }

    private doLogout = async () => {

        RX.Modal.dismissAll();

        ApiClient.stopSync();
        ApiClient.clearNextSyncToken();
        await ApiClient.clearStorage();
        await ApiClient.storeLastUserId();
        DataStore.clearRoomSummaryList();

        this.props.showLogin();
    }

    private getRoomMembersFromServer = (roomId: string) => {

        ApiClient.getRoomMembers(roomId, false)
            .then(members => {

                const members_: { [id: string]: User } = {};
                Object.values(this.state.members)
                    .map(member => {
                        members_[member.id] = { ...member, ...members[member.id] }
                    });

                this.setState({ members: { ...members, ...members_ } });

                DataStore.addMembers(this.props.roomId, members_);

                if (RX.Modal.isDisplayed('dialogroomheader')) {
                    RX.Modal.dismiss('dialogroomheader');
                    this.onPressHeader();
                }
            })
            .catch(_error => null);
    }

    private getContactPresence = () => {

        ApiClient.getPresence(this.roomSummary.contactId!)
            .then(response => {

                let lastSeenTime;

                if (response.last_active_ago) {
                    lastSeenTime = Date.now() - response.last_active_ago;
                } else {
                    lastSeenTime = DataStore.getLastSeenTime(this.roomSummary.contactId!);
                }

                this.setState({ lastSeen: this.getLastSeen(lastSeenTime) });
            })
            .catch(_error => null);
    }

    private onPressHomeButton = () => {

        this.props.showRoomList();
    }

    private onPressAvatar = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        RX.Modal.show(
            <DialogAvatar
                roomName={ this.state.name }
                avatarUrl={ this.state.avatarUrl }
                roomType={ this.state.type }
                roomPhase= { this.state.phase }
                roomId={ this.props.roomId }
            />,
            'avatardialog'
        );
    }

    private onPressHeader = () => {

        RX.Modal.show(
            <DialogRoomHeader
                roomId={ this.props.roomId }
                roomType={ this.state.type }
                roomPhase={ this.state.phase }
                members= { this.state.members }
                showRoomList={ this.props.showRoomList }
            />,
            'dialogroomheader'
        );
    }

    private getLastSeen = (lastSeenTime: number): string => {

        let lastSeen = '';

        if (!lastSeenTime || lastSeenTime < 100) {

            lastSeen = recentActivity[this.language] + 'N/A';

        } else if (differenceInMilliseconds(new Date(), lastSeenTime) < 30000) {

            lastSeen = online[this.language];

            const resetLastSeen = () => {
                const lastSeenTime = DataStore.getLastSeenTime(this.roomSummary.contactId!);
                this.setState({ lastSeen: this.getLastSeen(lastSeenTime) });
            }

            setTimeout(resetLastSeen, 31000);

        } else {

            let lastSeenTimeFormatted;

            if (isToday(lastSeenTime)) {

                lastSeenTimeFormatted = todayWord[this.language] + format(lastSeenTime, ' HH:mm', { locale: this.locale });

            } else if (isYesterday(lastSeenTime)) {

                lastSeenTimeFormatted = yesterdayWord[this.language] + format(lastSeenTime, ' HH:mm', { locale: this.locale });

            } else if (differenceInDays(new Date(), lastSeenTime) > 180) {

                lastSeenTimeFormatted = format(lastSeenTime, 'd MMM. yyyy', { locale: this.locale });

            } else {

                lastSeenTimeFormatted = format(lastSeenTime, 'd MMM. HH:mm', { locale: this.locale });
            }

            lastSeen = recentActivity[this.language] + lastSeenTimeFormatted;
        }

        return lastSeen;
    }

    public render(): JSX.Element | null {

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

        let alias: ReactElement | undefined = undefined;
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

        let subtitle: ReactElement | ReactElement[] | undefined = undefined;

        if (this.state.type === 'direct') {

            subtitle = (
                <RX.Text>
                    { this.state.lastSeen }
                </RX.Text>
            );

        } else if (this.state.type === 'community') {

            subtitle = (
                <RX.Text>
                    { communityMembers(this.joinMembersCount, this.language) }
                </RX.Text>
            );

        } else if (this.state.type === 'notepad') {

            subtitle = (
                <RX.Text>
                    { notepad[this.language] }
                </RX.Text>
            );

        } else if (this.state.members){

            let userArray: User[] = [];

            if (this.state.members) {

                userArray = Object.values(this.state.members)
                    .filter(member => (
                        member.membership &&
                    member.membership !== 'leave'
                    ))
                    .sort((a, b) => (
                        b.membership!.localeCompare(a.membership!) || // join before invite
                    a.id.localeCompare(b.id) // alphabetic
                    ));
            }

            const memberRenderArray: Array<ReactElement> = [];

            userArray.map(member => {

                const separator = memberRenderArray.length ? ', ' : '';
                let memberRender: ReactElement;
                if (member.membership === 'join') {
                    memberRender = (
                        <RX.Text numberOfLines={ 1 } key={ member.id }>
                            { separator + (member.name || member.id) }
                        </RX.Text>
                    );
                    memberRenderArray.push(memberRender);
                } else if (member.membership === 'invite') {
                    memberRender = (
                        <RX.Text numberOfLines={ 1 } key={ member.id } style={ {fontStyle: 'italic'} }>
                            { separator + (member.name || member.id) }
                        </RX.Text>
                    );
                    memberRenderArray.push(memberRender);
                }
            });

            subtitle = memberRenderArray;
        }

        let unread: ReactElement | undefined = undefined;
        if (this.state.totalUnreadCount !== undefined && this.state.totalUnreadCount > 0) {
            unread = (
                <RX.Text style={ [styles.unreadNumber, this.unreadTextStyle] }>
                    { this.state.totalUnreadCount > 9 ? '9+' : this.state.totalUnreadCount }
                </RX.Text>
            );
        }

        return (
            <RX.View style={ styles.container}>
                <RX.View
                    style={ styles.containerRoomHeader }
                    onPress={ () => this.onPressHeader() }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    <RX.View
                        style={ styles.containerAvatar }
                        onPress={ event => this.onPressAvatar(event) }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                    >
                        { avatar! }
                    </RX.View>
                    <RX.View style={ styles.containerRoomInfo }>
                        <RX.Text numberOfLines={ 1 } style={ styles.containerRoomName }>
                            <RX.Text numberOfLines={ 1 } style={ styles.roomName }>
                                { this.state.name }
                            </RX.Text>
                            { alias }
                        </RX.Text>
                        <RX.Text numberOfLines={ 1 } style={ styles.subtitle }>
                            { subtitle }
                        </RX.Text>
                    </RX.View>
                </RX.View>
                <RX.View style={ styles.containerHomeButton }>
                    <RX.Button
                        style={ styles.roundButton }
                        onPress={ () => this.onPressHomeButton() }
                        disableTouchOpacityAnimation={ false }
                        underlayColor={ LOGO_BACKGROUND }
                        activeOpacity={ 0.8 }
                    >
                        <RX.View style={ styles.containerIcon }>
                            <IconSvg
                                source= { require('../resources/svg/home.json') as SvgFile }
                                fillColor={ LOGO_BACKGROUND }
                                height={ BUTTON_ROUND_WIDTH / ICON_REDUCTION_FACTOR }
                                width={ BUTTON_ROUND_WIDTH / ICON_REDUCTION_FACTOR }
                            />
                        </RX.View>
                    </RX.Button>

                    { unread }

                </RX.View>
            </RX.View>
        );
    }
}
