import React from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import CommunityTile from '../components/CommunityTile';
import { MODAL_CONTENT_TEXT, OPAQUE_BACKGROUND, BORDER_RADIUS, TILE_WIDTH, SPACING, FONT_LARGE, CONTAINER_PADDING,
    BUTTON_HEIGHT, PLACEHOLDER_TEXT, OBJECT_MARGIN } from '../ui';
import { theSearchDidNotReturn, theSearchTakesTooLong, cancel, theSearchReturnedError, theCommunity, pressOKToJoin, search, communityName,
    serverName, waitSearch, Languages } from '../translations';
import UiStore from '../stores/UiStore';
import { ErrorResponse_, PublicRoom_ } from '../models/MatrixApi';
import SpinnerUtils from '../utils/SpinnerUtils';
import AppFont from '../modules/AppFont';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
    }),
    inputBoxContainer:  RX.Styles.createViewStyle({
        alignSelf: 'stretch',
        margin: SPACING,
    }),
    inputBox: RX.Styles.createTextInputStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_LARGE,
        paddingHorizontal: CONTAINER_PADDING,
        height: BUTTON_HEIGHT,
        borderRadius: BORDER_RADIUS,
        alignSelf: 'stretch',
    }),
    modalScreenRoomList: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        justifyContent: 'center',
        backgroundColor: OPAQUE_BACKGROUND,
    }),
    modalView: RX.Styles.createViewStyle({
        alignSelf: 'center',
        justifyContent: 'center',
        width: TILE_WIDTH,
        marginVertical: OBJECT_MARGIN,
    }),
    textDialog: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        textAlign: 'center',
        color: MODAL_CONTENT_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
};

interface DialogJoinCommunityProps {
    showRoom: (roomId: string) => void;
}

export default class DialogJoinCommunity extends RX.Component<DialogJoinCommunityProps, RX.Stateless> {

    private searchValue = '';
    private serverName = '';
    private language: Languages = 'en';

    constructor(props: DialogJoinCommunityProps) {
        super(props);

        this.language = UiStore.getLanguage();
    }

    private searchCommunities = () => {

        RX.Modal.dismissAll();

        const filter = {
            generic_search_term: this.searchValue,
        }

        const options = {
            limit: 100,
            filter: filter,
        }

        let getPublicRoomsCallReturned = false;

        const showCancelSearch = () => {

            if (getPublicRoomsCallReturned) { return; }

            SpinnerUtils.dismissModalSpinner('searchcommunityspinner')

            const text = (
                <RX.Text style={ styles.textDialog }>
                    { theSearchTakesTooLong[this.language] }
                </RX.Text>
            );

            RX.Modal.show(
                <DialogContainer
                    content={ text }
                    confirmButton={ true }
                    confirmButtonText={ waitSearch[this.language] }
                    onConfirm={ waitForResult }
                    cancelButton={ true }
                    cancelButtonText={ cancel[this.language] }
                    onCancel={ () => this.showDialogJoinCommunity() }
                />,
                'modaldialog_cancelsearch'
            );
        };

        const waitForResult = () => {

            SpinnerUtils.showModalSpinner('searchcommunityspinner');

            setTimeout(showCancelSearch, 15000);
        };

        waitForResult();

        if (this.serverName === ApiClient.credentials.homeServer) {
            this.serverName = '';
        }

        ApiClient.getPublicRooms(options, this.serverName)
            .then(response => {

                getPublicRoomsCallReturned = true;

                if (!response || !response.chunk || response.chunk.length === 0) {

                    RX.Modal.dismissAll();

                    const text = (
                        <RX.Text style={ styles.textDialog }>
                            { theSearchDidNotReturn[this.language] }
                        </RX.Text>
                    );

                    RX.Modal.show(
                        <DialogContainer
                            content={ text }
                            confirmButton={ false }
                            cancelButton={ true }
                            cancelButtonText={ 'OK' }
                            onCancel={ () => this.showDialogJoinCommunity() }
                        />,
                        'modaldialog_noroomfound'
                    );

                } else {

                    RX.Modal.dismiss('modaldialog_searchcommunity');

                    this.showRoomList(response.chunk);
                }
            })
            .catch((error: ErrorResponse_) => {

                RX.Modal.dismiss('modaldialog_searchcommunity');

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { theSearchReturnedError + ': "' + error.body.error + '".' }
                    </RX.Text>
                );

                RX.Modal.show(
                    <DialogContainer
                        content={ text }
                        confirmButton={ false }
                        cancelButton={ true }
                        cancelButtonText={ 'OK' }
                        onCancel={ () => this.showDialogJoinCommunity() }
                    />,
                    'modaldialog_noroomfound'
                );
            });
    }

    private showDialogJoinCommunity = () => {

        RX.Modal.dismissAll();

        RX.Modal.show(<DialogJoinCommunity showRoom={ this.props.showRoom }/>, 'modaldialog_searchcommunity');
    }

    private showRoomList = (rooms: PublicRoom_[]) => {

        const roomTiles = rooms
            .map(room => {
                return (
                    <CommunityTile
                        key={ room.room_id }
                        roomResponse={ room }
                        server={ this.serverName }
                        askJoinRoom={ () => this.askJoinCommunity(room.room_id, room.name || room.canonical_alias) }
                    />
                );
            });

        const roomList = (
            <RX.View
                style={ styles.modalScreenRoomList }
                onPress={ () => this.showDialogJoinCommunity() }
                disableTouchOpacityAnimation={ true }
            >
                <RX.View
                    style={ styles.modalView }
                    onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    <RX.ScrollView style={ { width: UiStore.getPlatform() === 'web' ? TILE_WIDTH + 30 : TILE_WIDTH} }>
                        { roomTiles }
                    </RX.ScrollView>
                </RX.View>
            </RX.View>
        );

        SpinnerUtils.dismissModalSpinner('searchcommunityspinner')

        RX.Modal.show(roomList, 'roomlist');
    }

    private askJoinCommunity = (roomId: string, roomName: string) => {

        RX.Modal.dismissAll();

        const text = (
            <RX.Text style={ styles.textDialog }>
                <RX.Text>
                    { pressOKToJoin[this.language] }
                </RX.Text>
                <RX.Text style={ { fontWeight: 'bold' } }>
                    { ' ' + roomName }
                </RX.Text>
                <RX.Text>
                    { theCommunity[this.language] }
                </RX.Text>
            </RX.Text>
        );

        const dialog = (
            <DialogContainer
                content={ text }
                confirmButton={ true }
                confirmButtonText={ 'OK' }
                cancelButton={ true }
                cancelButtonText={ cancel[this.language] }
                onConfirm={ () => this.joinCommunity(roomId) }
                onCancel={ () => this.showDialogJoinCommunity() }
            />
        );

        RX.Modal.show(dialog, 'modaldialog_askjoincommunity');
    }

    private joinCommunity = (roomId: string) => {

        SpinnerUtils.showModalSpinner('joincommunityspinner');

        ApiClient.joinRoom(roomId)
            .then(_response => {

                ApiClient.muteRoomNotifications(roomId, true);

                RX.Modal.dismissAll();

                this.props.showRoom(roomId);
            })
            .catch(_error => {
                RX.Modal.dismissAll();
            });
    }

    public render(): JSX.Element | null {

        const textInput = (
            <RX.View style={ styles.inputBoxContainer }>
                <RX.TextInput
                    style={ styles.inputBox }
                    placeholder={ communityName[this.language] }
                    placeholderTextColor={ PLACEHOLDER_TEXT }
                    onChangeText={ searchValue => this.searchValue = searchValue }
                    keyboardType={ 'default' }
                    disableFullscreenUI={ true }
                    allowFontScaling={ false }
                    autoCapitalize={ 'none' }
                    autoCorrect={ false }
                    autoFocus={ true }
                    spellCheck={ false }
                />
                <RX.TextInput
                    style={ styles.inputBox }
                    placeholder={ serverName[this.language] }
                    placeholderTextColor={ PLACEHOLDER_TEXT }
                    onChangeText={ serverName => this.serverName = serverName }
                    keyboardType={ 'default' }
                    disableFullscreenUI={ true }
                    allowFontScaling={ false }
                    autoCapitalize={ 'none' }
                    autoCorrect={ false }
                    autoFocus={ false }
                    spellCheck={ false }
                />
            </RX.View>
        );

        const joinCommunityDialog = (
            <DialogContainer
                content={ textInput }
                confirmButton={ true }
                confirmButtonText={ search[this.language] }
                cancelButton={ true }
                cancelButtonText={ cancel[this.language] }
                onConfirm={ this.searchCommunities }
                onCancel={ () => RX.Modal.dismissAll() }
            />
        );

        return (
            <RX.View style={ styles.modalScreen }>
                { joinCommunityDialog }
            </RX.View>
        );
    }
}
