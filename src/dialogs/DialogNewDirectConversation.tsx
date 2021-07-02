import React, { ReactElement } from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import ModalSpinner from '../components/ModalSpinner';
import DialogContainer from '../modules/DialogContainer';
import DataStore from '../stores/DataStore';
import { MODAL_CONTENT_TEXT, BORDER_RADIUS, FONT_LARGE, SPACING, TILE_HEIGHT, BUTTON_HEIGHT, INPUT_BACKGROUND, CONTAINER_PADDING,
    PLACEHOLDER_TEXT, TRANSPARENT_BACKGROUND, DIALOG_WIDTH } from '../ui';
import UiStore from '../stores/UiStore';
import { inviteUser, cancel, userServer, errorNoConfirm, theUserId, doesntSeemToExist, warningNoSelfDirect,
    Languages } from '../translations';
import { User } from '../models/User';
import UserTile from '../components/UserTile';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
    }),
    container: RX.Styles.createViewStyle({
        flex: 1,
        justifyContent: 'center',
    }),
    userListContainer: RX.Styles.createViewStyle({
        flex: 1,
    }),
    userListView: RX.Styles.createViewStyle({
        alignSelf: 'center',
        marginBottom: SPACING,
    }),
    inputBox: RX.Styles.createTextInputStyle({
        fontSize: FONT_LARGE,
        paddingHorizontal: CONTAINER_PADDING,
        height: BUTTON_HEIGHT,
        borderRadius: BORDER_RADIUS,
        alignSelf: 'stretch',
        backgroundColor: INPUT_BACKGROUND,
    }),
    textDialog: RX.Styles.createTextStyle({
        textAlign: 'center',
        color: MODAL_CONTENT_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
};

interface DialogNewDirectConversationProps {
    showRoom: (roomID: string) => void;
}

interface DialogNewDirectConversationState {
    userId: string | undefined;
}

export default class DialogNewDirectConversation extends RX.Component<DialogNewDirectConversationProps, DialogNewDirectConversationState> {

    private userId = '';
    private language: Languages = 'en';

    constructor(props: DialogNewDirectConversationProps) {
        super(props);

        this.language = UiStore.getLanguage();

        this.state = { userId: undefined }
    }

    private createNewDirect = () => {

        if (!this.userId) { return; }

        if (!this.userId.includes('@')) {
            this.userId = '@' + this.userId + ':' + ApiClient.credentials.homeServer;
        }

        if (this.userId === ApiClient.credentials.userIdFull) {

            const text = (
                <RX.Text style={ styles.textDialog }>
                    { warningNoSelfDirect[this.language] }
                </RX.Text>
            );

            RX.Modal.show(<DialogContainer content={ text } modalId={ 'warning_noself' }/>, 'warning_noself');

            return;
        }

        RX.Modal.dismissAll();

        RX.Modal.show(<ModalSpinner/>, 'modalspinner_createnewdirect');

        const existingDirectRooms = DataStore.getSortedRoomList()
            .filter(room => (
                room.contactId === this.userId
            ))
            .sort((a, b) => (
                (Number(b.active) - Number(a.active)) ||
            (b.newEvents[0].time - a.newEvents[0].time)
            ));

        if (existingDirectRooms.length > 0) {

            RX.Modal.dismiss('modalspinner_createnewdirect');

            this.props.showRoom(existingDirectRooms[0].id);

        } else {

            ApiClient.getUserProfile(this.userId)
                .then(_response => {

                    ApiClient.createNewRoom('direct', '', this.userId)
                        .then(response => {

                            RX.Modal.dismissAll();

                            this.props.showRoom(response.room_id);
                        })
                        .catch(_error => {

                            RX.Modal.dismissAll();

                            const text = (
                                <RX.Text style={ styles.textDialog }>
                                    { errorNoConfirm[this.language] }
                                </RX.Text>
                            );

                            RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
                        });
                })
                .catch(_error => {

                    RX.Modal.dismiss('modalspinner_createnewdirect');

                    const text = (
                        <RX.Text style={ styles.textDialog }>
                            <RX.Text>
                                { theUserId[this.language] }
                            </RX.Text>
                            <RX.Text style={ { fontWeight: 'bold' } }>
                                { ' ' + this.userId + ' ' }
                            </RX.Text>
                            <RX.Text>
                                { doesntSeemToExist[this.language] }
                            </RX.Text>
                        </RX.Text>
                    );

                    const modalDialog = (
                        <DialogContainer
                            content={ text }
                            cancelButton={ true }
                            cancelButtonText={ 'OK' }
                            onCancel={ () =>
                                RX.Modal.show(<DialogNewDirectConversation showRoom={ this.props.showRoom }/>, 'createdirectdialog') }
                        />
                    );

                    RX.Modal.show(modalDialog, 'modaldialog_useridnotfound');
                })
        }
    }

    private setUserId = (userId: string) => {

        this.userId = userId;
        this.setState({ userId: userId });
    }

    public render(): JSX.Element | null {

        const users: { [id: string]: User } = DataStore.getUsers();

        const userListItems: User[] = [];

        let userList: ReactElement;

        for (const userId in users) {
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
                            inviteUser={ this.setUserId }
                            canPress={ true }
                            hideMembership={ true }
                        />
                    );
                });

            userList = (
                <RX.View
                    style={ [styles.userListView, { height: Math.min(5, userTiles.length) * (TILE_HEIGHT + SPACING) }] }
                >
                    <RX.ScrollView
                        style={ { width: UiStore.getPlatform() === 'web' ? DIALOG_WIDTH + 30 : DIALOG_WIDTH} }
                        keyboardShouldPersistTaps={ 'always' }
                    >
                        { userTiles }
                    </RX.ScrollView>
                </RX.View>
            );
        }

        const textInput = (
            <RX.TextInput
                style={ styles.inputBox }
                placeholder={ userServer[this.language] }
                placeholderTextColor={ PLACEHOLDER_TEXT }
                onChangeText={ userId => this.userId = userId }
                disableFullscreenUI={ true }
                autoCapitalize={ 'none' }
                keyboardType={ UiStore.getPlatform() === 'web' ? 'default' : 'email-address' }
                autoCorrect={ false }
                autoFocus={ true }
                value={ this.state.userId }
                onKeyPress={ () => this.setState({ userId: undefined })}
            />
        );

        const content = (
            <RX.View style={ styles.container }>
                { userList! }
                { textInput }
            </RX.View>
        );

        const createConversationDialog = (
            <DialogContainer
                content={ content }
                confirmButton={ true }
                confirmButtonText={ inviteUser[this.language] }
                cancelButton={ true }
                cancelButtonText={ cancel[this.language] }
                onConfirm={ this.createNewDirect }
                onCancel={ () => RX.Modal.dismissAll() }
                backgroundColorContent={ TRANSPARENT_BACKGROUND }
            />
        );

        return (
            <RX.View style={ styles.modalScreen }>
                { createConversationDialog }
            </RX.View>
        );
    }
}
