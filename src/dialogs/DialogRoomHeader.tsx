import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { User } from '../models/User';
import ApiClient from '../matrix/ApiClient';
import ModalSpinner from '../components/ModalSpinner';
import UserTile from '../components/UserTile';
import { VirtualListView, VirtualListViewItemInfo, VirtualListViewCellRenderDetails } from 'reactxp-virtuallistview';
import DataStore from '../stores/DataStore';
import DialogContainer from '../modules/DialogContainer';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import { BUTTON_MODAL_BACKGROUND, BUTTON_MODAL_TEXT, MODAL_CONTENT_BACKGROUND, OPAQUE_BACKGROUND, BUTTON_DISABLED_TEXT, BORDER_RADIUS,
    TILE_WIDTH, BUTTON_LONG_WIDTH, BUTTON_HEIGHT, SPACING, FONT_LARGE, FONT_NORMAL, TILE_HEIGHT, OBJECT_MARGIN, LOGO_BACKGROUND,
    OPAQUE_DUMMY_BACKGROUND } from '../ui';
import { theInvitationWasSent, theInvitationNotSent, cancel, pressOKToInvite, toThisGroup, pressOKToLeaveRoom, inviteAdditionalUser,
    leaveRoom, youDoNotHavePrivateContacts, youHaveLeftRoom1, youHaveLeftRoom2, Languages } from '../translations';
import { ErrorResponse_, RoomPhase, RoomType } from '../models/MatrixApi';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch', // expands modal full horizontal
        backgroundColor: OPAQUE_BACKGROUND, // trick to apply opacity only on the color
        justifyContent: 'center', // puts list in vertical center
    }),
    modalView: RX.Styles.createViewStyle({
        alignSelf: 'center', // puts list in horizontal center
        justifyContent: 'center',
        width: TILE_WIDTH,
        minHeight: TILE_HEIGHT + SPACING,
        maxHeight: 360,
    }),
    button: RX.Styles.createViewStyle({
        borderRadius: BUTTON_HEIGHT / 2,
        width: BUTTON_LONG_WIDTH,
        height: BUTTON_HEIGHT,
        backgroundColor: BUTTON_MODAL_BACKGROUND,
        marginTop: OBJECT_MARGIN,
    }),
    topic: RX.Styles.createViewStyle({
        flex: 1,
        borderRadius: BORDER_RADIUS,
        maxHeight: TILE_HEIGHT * 1.5,
        width: TILE_WIDTH,
        backgroundColor: MODAL_CONTENT_BACKGROUND,
        marginBottom: OBJECT_MARGIN,
        padding: SPACING,
        alignSelf: 'center',
    }),
    aliasText: RX.Styles.createTextStyle({
        fontSize: FONT_NORMAL,
        fontWeight: 'bold',
    }),
    topicScrollView: RX.Styles.createViewStyle({
        flex: 1,
    }),
    topicText: RX.Styles.createTextStyle({
        flex: 1,
        fontSize: FONT_NORMAL,
    }),
    buttonText: RX.Styles.createTextStyle({
        fontSize: FONT_LARGE,
        marginVertical: SPACING,
        textAlign: 'center',
        color: BUTTON_MODAL_TEXT,
    }),
    containerButtons: RX.Styles.createViewStyle({
        alignItems: 'center', // puts button in horizontal center
    }),
    textDialog: RX.Styles.createTextStyle({
        textAlign: 'center',
        color: BUTTON_MODAL_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
    spinnerContainer: RX.Styles.createViewStyle({
        position: 'absolute',
        height: TILE_WIDTH,
        width: TILE_WIDTH,
        justifyContent: 'center', // puts spinner in vertical center
        alignItems: 'center',
    }),
    containerWrapper: RX.Styles.createViewStyle({
        backgroundColor: OPAQUE_DUMMY_BACKGROUND, // needed to prevent onpress event outside of message tile
    }),
}

interface DialogRoomHeaderProps extends RX.CommonProps {
    roomId: string;
    roomType: RoomType;
    roomPhase: RoomPhase;
    members: { [id: string]: User };
    showRoomList: () => void;
}

interface DialogRoomHeaderState {
    userListItems: UserListItemInfo[];
    showSpinner: boolean,
    offline: boolean;
}

interface UserListItemInfo extends VirtualListViewItemInfo {
    member: User;
}

export default class DialogRoomHeader extends ComponentBase<DialogRoomHeaderProps, DialogRoomHeaderState> {

    private inviteUserId = '';
    private topic: string;
    private alias: string;
    private powerLevel: number;
    private language: Languages = 'en';

    constructor(props: DialogRoomHeaderProps) {
        super(props);

        this.topic = DataStore.getTopic(props.roomId)!;
        this.alias = DataStore.getAlias(props.roomId)!;
        this.powerLevel = DataStore.getPowerLevel(props.roomId, ApiClient.credentials.userIdFull);
        this.language = UiStore.getLanguage();
    }

    protected _buildState(nextProps: DialogRoomHeaderProps, initState: boolean, _prevState: DialogRoomHeaderState)
        : Partial<DialogRoomHeaderState> {

        const partialState: Partial<DialogRoomHeaderState> = {};

        if (initState) {

            partialState.showSpinner = false;
            partialState.userListItems = this.getUserListItems(nextProps.members);

            if (nextProps.roomType === 'community') {

                partialState.showSpinner = true;
                this.getRoomMembersFromServer(nextProps.roomId);
            }
        }

        partialState.offline = UiStore.getOffline();

        return partialState;
    }

    private getUserListItems = (members: { [id: string]: User }) => {

        const userListItems = Object.values(members)
            .filter(member => (
                member.id !== 'unknown' &&
            member.membership &&
            member.membership !== 'leave'
            ))
            .sort((a, b) => (
                ((b.powerLevel || 0) - (a.powerLevel || 0))
            ))
            .map(member => {
                return {
                    key: member.id,
                    height: TILE_HEIGHT + SPACING,
                    template: 'member',
                    member: member,
                    measureHeight: false,
                }
            });

        return userListItems;
    }

    private getRoomMembersFromServer = (roomId: string) => {

        ApiClient.getRoomMembers(roomId, true)
            .then(members => {

                const members_: { [id: string]: User } = {};
                Object.values(this.props.members)
                    .map(member => {
                        members_[member.id] = { ...member, ...members[member.id] }
                    });

                const userListItems = this.getUserListItems({ ...members, ...members_ });

                this.setState({
                    userListItems: userListItems,
                    showSpinner: false,
                });
            })
            .catch(_error => {                
                this.setState({ showSpinner: false });
            });
    }

    private sendInvitation = () => {

        RX.Modal.dismiss('inviteconfirmation');
        RX.Modal.show(<ModalSpinner/>, 'modalspinner_sendinvitation');

        ApiClient.inviteToRoom(this.props.roomId, this.inviteUserId)
            .then(_response => {

                RX.Modal.dismissAll();

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { theInvitationWasSent[this.language] }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'modaldialog');
            })
            .catch(_error => {

                RX.Modal.dismissAll();

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { theInvitationNotSent[this.language] }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
            });
    }

    private inviteUser = (userId: string) => {

        this.inviteUserId = userId;

        RX.Modal.dismiss('userlist');

        const text = (
            <RX.Text style={ styles.textDialog }>
                <RX.Text>
                    { pressOKToInvite[this.language] }
                </RX.Text>
                <RX.Text style={ { fontWeight: 'bold' } }>
                    { ' ' + userId + ' ' }
                </RX.Text>
                <RX.Text>
                    { toThisGroup[this.language] }
                </RX.Text>
            </RX.Text>
        );

        const inviteConfirmation = (
            <DialogContainer
                content={ text }
                confirmButton={ true }
                confirmButtonText={ 'OK' }
                cancelButton={ true }
                cancelButtonText={ cancel[this.language] }
                onConfirm={ () => this.sendInvitation() }
                onCancel={ () => RX.Modal.dismissAll() }
            />
        );

        RX.Modal.show(inviteConfirmation, 'inviteconfirmation');
    }

    private onPressLeaveRoom = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        const text = (
            <RX.Text style={ styles.textDialog }>
                { pressOKToLeaveRoom[this.language + '_' + this.props.roomType.substr(0,2)] }
            </RX.Text>
        );

        const leaveRoomConfirmation = (
            <DialogContainer
                content={ text }
                confirmButton={ true }
                confirmButtonText={ 'OK' }
                cancelButton={ true }
                cancelButtonText={ cancel[this.language] }
                onConfirm={ () => this.leaveRoom() }
                onCancel={ () => RX.Modal.dismissAll() }
            />
        );

        RX.Modal.show(leaveRoomConfirmation, 'leaveRoomConfirmation');
    }

    private leaveRoom = () => {

        // TODO: notepad
        // when the API endpoint is finally available
        // leave and delete notepad room from server
        // https://github.com/matrix-org/matrix-doc/issues/1882

        RX.Modal.dismissAll();

        const roomName = DataStore.getRoomName(this.props.roomId);

        DataStore.removeRoom(this.props.roomId);

        this.props.showRoomList();

        RX.Modal.show(<ModalSpinner/>, 'modalspinner');

        ApiClient.leaveRoom(this.props.roomId)
            .then(_response => {

                RX.Modal.dismiss('modalspinner');

                const text = (

                    <RX.Text style={ styles.textDialog }>
                        <RX.Text>
                            { youHaveLeftRoom1[this.language + '_' + this.props.roomType.substr(0, 2)] }
                        </RX.Text>
                        <RX.Text style={ { fontWeight: 'bold' } }>
                            { roomName }
                        </RX.Text>
                        <RX.Text>
                            { youHaveLeftRoom2[this.language + '_' + this.props.roomType.substr(0, 2)] }
                        </RX.Text>
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'successdialog' }/>, 'successdialog');
            })
            .catch((error: ErrorResponse_) => {

                RX.Modal.dismiss('modalspinner');

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { error.body && error.body.error ? error.body.error : '[Unknown error]' }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
            });
    }

    private onPressAddButton = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        RX.Modal.dismiss('memberlist');

        const users: { [id: string]: User } = DataStore.getUsers();

        const userListItems: User[] = [];

        for (const userId in users) {

            if (this.props.members[userId] && this.props.members[userId].membership !== 'leave') { continue }
            userListItems.push(users[userId]);
        }

        if (userListItems.length > 0) {

            const userTiles = userListItems
                .filter(user => (
                    user.id !== ApiClient.credentials.userIdFull
                ))
                .sort((a, b) => (
                    a.id.localeCompare(b.id)
                ))
                .map((user: User) => {
                    return (
                        <UserTile
                            key={ user.id }
                            user={ user }
                            inviteUser={ () => this.inviteUser(user.id) }
                            canPress={ true }
                            hideMembership={ true }
                        />
                    );
                });

            const userList = (
                <RX.View
                    style={ styles.modalScreen }
                    onPress={() => RX.Modal.dismissAll() }
                    disableTouchOpacityAnimation={ true }
                >
                    <RX.View
                        style={ [styles.modalView, { height: userTiles.length * (TILE_HEIGHT + SPACING) }] }
                        onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                    >
                        <RX.ScrollView style={ { width: UiStore.getPlatform() === 'web' ? TILE_WIDTH + 30 : TILE_WIDTH} }>
                            { userTiles }
                        </RX.ScrollView>
                    </RX.View>
                </RX.View>
            );

            RX.Modal.show(userList, 'userlist');

        } else {

            const text = (
                <RX.Text style={ styles.textDialog }>
                    { youDoNotHavePrivateContacts[this.language] }
                </RX.Text>
            );

            RX.Modal.show(<DialogContainer content={ text }/>, 'modaldialog');
        }
    }

    private renderItem = (cellRender: VirtualListViewCellRenderDetails<UserListItemInfo>) => {

        const userWrapper = (
            <RX.View
                style={ styles.containerWrapper }
                onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                disableTouchOpacityAnimation={ true }
                activeOpacity={ 1 }
            >
                <UserTile
                    key={ cellRender.item.member.id }
                    user={ cellRender.item.member }
                    hideMembership={ false }
                    roomId={ this.props.roomId }
                />
            </RX.View>
        )

        return userWrapper;
    }

    public render(): JSX.Element | null {

        let leaveRoomButton: ReactElement | undefined;
        if (this.props.roomPhase === 'join') {

            leaveRoomButton = (
                <RX.Button
                    style={ styles.button }
                    onPress={ event => this.onPressLeaveRoom(event) }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                    disabled={ this.state.offline }
                    disabledOpacity={ 1 }
                >
                    <RX.Text style={ [styles.buttonText, this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined] }>
                        { leaveRoom[this.language + '_' + this.props.roomType.substr(0, 2)] }
                    </RX.Text>
                </RX.Button>
            );
        }

        let addUserButton: ReactElement | undefined;
        if (this.props.roomType === 'group' && this.props.roomPhase === 'join') {
            addUserButton = (
                <RX.Button
                    style={ styles.button }
                    onPress={ event => this.onPressAddButton(event) }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                    disabled={ this.state.offline || this.powerLevel !== 100 }
                    disabledOpacity={ 1 }
                >
                    <RX.Text
                        style={ [
                            styles.buttonText,
                            (this.state.offline || this.powerLevel) !== 100 ? { color: BUTTON_DISABLED_TEXT } : undefined,
                        ] }
                    >
                        { inviteAdditionalUser[this.language] }
                    </RX.Text>
                </RX.Button>
            );
        }

        let topicTile: ReactElement | undefined;
        if (this.props.roomType === 'community' && this.topic) {
            topicTile = (
                <RX.View
                    style={ styles.topic }
                    onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    <RX.Text numberOfLines={ 1 } style={ styles.aliasText }>
                        { this.alias }
                    </RX.Text>
                    <RX.ScrollView style={ styles.topicScrollView }>
                        <RX.Text
                            style={ styles.topicText }
                            onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                        >
                            { this.topic }
                        </RX.Text>
                    </RX.ScrollView>
                </RX.View>
            );
        }

        let spinner: ReactElement | undefined;
        if (this.state.showSpinner) {
            spinner = (
                <RX.View style={ styles.spinnerContainer }>
                    <RX.ActivityIndicator color={ LOGO_BACKGROUND } size={ 'large' } />
                </RX.View>
            );
        }

        return (
            <RX.View
                style={ styles.modalScreen }
                onPress={ () => RX.Modal.dismissAll() }
                disableTouchOpacityAnimation={ true }
            >

                { topicTile }

                <RX.View
                    style={ [styles.modalView, { height: this.state.userListItems.length * (TILE_HEIGHT + SPACING) }] }
                    onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >

                    <VirtualListView
                        itemList={ this.state.userListItems }
                        renderItem={ this.renderItem }
                        skipRenderIfItemUnchanged={ true }
                        animateChanges={ true }
                    />

                    { spinner }

                </RX.View>
                <RX.View style={ styles.containerButtons }>

                    { addUserButton }

                    { leaveRoomButton }

                </RX.View>
            </RX.View>
        );
    }
}
