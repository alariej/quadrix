import React, { ReactElement } from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import DataStore from '../stores/DataStore';
import { MODAL_CONTENT_TEXT, BORDER_RADIUS, FONT_LARGE, TILE_HEIGHT, BUTTON_HEIGHT, INPUT_BACKGROUND, CONTAINER_PADDING,
    PLACEHOLDER_TEXT, DIALOG_WIDTH, TILE_BACKGROUND, OBJECT_MARGIN, BUTTON_MODAL_BACKGROUND, SPACING, BUTTON_MODAL_TEXT,
    MODAL_DISABLED_TEXT, OPAQUE_BACKGROUND } from '../ui';
import UiStore from '../stores/UiStore';
import { inviteUser, cancel, userServer, errorNoConfirm, theUserId, doesntSeemToExist, warningNoSelfDirect,
    Languages, searchUser, tooManySearchResults, noSearchResults, enterSearch, searchInstruction } from '../translations';
import { User } from '../models/User';
import UserTile from '../components/UserTile';
import { PlatformType } from 'reactxp/dist/common/Types';
import SpinnerUtils from '../utils/SpinnerUtils';
import AppFont from '../modules/AppFont';
import StringUtils from '../utils/StringUtils';
import KeyboardAwareView from '../modules/KeyboardAwareView';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        backgroundColor: OPAQUE_BACKGROUND
    }),
    container: RX.Styles.createViewStyle({
        flex: 1,
        justifyContent: 'center',
        marginTop: OBJECT_MARGIN,
        width: DIALOG_WIDTH,
    }),

    userListView: RX.Styles.createViewStyle({
        flex: 1,
    }),
    infoTile: RX.Styles.createViewStyle({
        borderRadius: BORDER_RADIUS,
        backgroundColor: TILE_BACKGROUND,
        minHeight: TILE_HEIGHT
    }),
    inputBox: RX.Styles.createTextInputStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_LARGE,
        paddingHorizontal: CONTAINER_PADDING,
        height: BUTTON_HEIGHT,
        borderRadius: BORDER_RADIUS,
        marginTop: OBJECT_MARGIN,
        backgroundColor: INPUT_BACKGROUND,
    }),
    textDialog: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        textAlign: 'center',
        color: MODAL_CONTENT_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
    buttonContainer: RX.Styles.createViewStyle({
        flexDirection: 'row',
        marginVertical: OBJECT_MARGIN
    }),
    button: RX.Styles.createViewStyle({
        width: DIALOG_WIDTH / 2 - OBJECT_MARGIN / 2,
        height: BUTTON_HEIGHT,
        borderRadius: BUTTON_HEIGHT / 2,
        backgroundColor: BUTTON_MODAL_BACKGROUND,
    }),
    buttonText: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_LARGE,
        marginVertical: SPACING,
        textAlign: 'center',
        color: BUTTON_MODAL_TEXT,
    })
};

interface DialogNewDirectConversationProps {
    showRoom: (roomID: string) => void;
}

interface DialogNewDirectConversationState {
    userId: string | undefined;
    userTiles: JSX.Element[] | undefined;
    infoTile: ReactElement | undefined;
    isSearch: boolean;
    isConfirmDisabled: boolean;
}

export default class DialogNewDirectConversation extends RX.Component<DialogNewDirectConversationProps, DialogNewDirectConversationState> {

    private userId = '';
    private language: Languages = 'en';
    private platform: PlatformType;

    constructor(props: DialogNewDirectConversationProps) {
        super(props);

        this.language = UiStore.getLanguage();
        this.platform = UiStore.getPlatform();

        this.state = {
            userId: undefined,
            userTiles: undefined,
            infoTile: undefined,
            isSearch: true,
            isConfirmDisabled: false,
        }
    }

    public componentDidMount(): void {

        const users = DataStore.getUsers();

        if (users.length > 0) {

            const userTiles = users
                // .filter(user => user.id === '@dani:al4.re')
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

            this.setState({ userTiles: userTiles })

        } else {

            const infoTile = (
                <RX.View
                    style={ styles.infoTile }
                >
                    <RX.Text style={ styles.textDialog }>
                        { searchInstruction[this.language] }
                    </RX.Text>
                </RX.View>
            );

            this.setState({ infoTile: infoTile, isSearch: true });
        }
    }

    private searchOnServer = () => {

        if (!this.userId) { return; }

        this.setState({ isConfirmDisabled: true });

        ApiClient.searchUser(this.userId)
            .then(response => {

                if (response.limited) {

                    const infoTile = (
                        <RX.View
                            style={ styles.infoTile }
                        >
                            <RX.Text style={ styles.textDialog }>
                                { tooManySearchResults[this.language] }
                            </RX.Text>
                        </RX.View>
                    );

                    this.setState({ infoTile: infoTile, isSearch: true, isConfirmDisabled: false });

                } else if (response.results.length === 0) {

                    const infoTile = (
                        <RX.View
                            style={ styles.infoTile }
                        >
                            <RX.Text style={ styles.textDialog }>
                                { noSearchResults[this.language] }
                            </RX.Text>
                        </RX.View>
                    );

                    this.setState({ infoTile: infoTile, isSearch: true, isConfirmDisabled: false });

                } else {

                    const userTiles = response.results
                        .sort((a, b) => (
                            a.user_id.localeCompare(b.user_id)
                        ))
                        .map(user_ => {
                            const user: User = {
                                id: user_.user_id,
                                avatarUrl: user_.avatar_url,
                                name: user_.display_name
                            }
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

                    this.setState({ userTiles: userTiles, infoTile: undefined, isSearch: true, isConfirmDisabled: false });
                }
            })
            .catch(_error => {

                const infoTile = (
                    <RX.View
                        style={ styles.infoTile }
                    >
                        <RX.Text style={ styles.textDialog }>
                            { noSearchResults[this.language] }
                        </RX.Text>
                    </RX.View>
                );

                this.setState({ infoTile: infoTile, isSearch: true, isConfirmDisabled: false });
            });
    }

    private createNewDirect = () => {

        if (!this.userId) { return; }

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

        SpinnerUtils.showModalSpinner('newdirectspinner');

        const existingDirectRooms = DataStore.getSortedRoomList()
            .filter(room => (
                room.contactId === this.userId
            ))
            .sort((a, b) => (
                (Number(b.active) - Number(a.active)) ||
            (b.newEvents[0].time - a.newEvents[0].time)
            ));

        if (existingDirectRooms.length > 0) {

            SpinnerUtils.dismissModalSpinner('newdirectspinner');

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

                    RX.Modal.dismiss('newdirectspinner');

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
        this.setState({ userId: userId, isSearch: false });
    }

    private onEditUserId = (text: string) => {

        this.userId = text;
        const userId = StringUtils.parseUserId(text);
        this.setState({ isSearch: !(userId.user && userId.server) });
    }

    public render(): JSX.Element | null {

        const textInput = (
            <RX.TextInput
                style={ styles.inputBox }
                placeholder={ this.state.isSearch ? enterSearch[this.language] : userServer[this.language] }
                placeholderTextColor={ PLACEHOLDER_TEXT }
                onChangeText={ this.onEditUserId }
                onKeyPress={ () => this.setState({ userId: undefined })}
                value={ this.state.userId }
                keyboardType={ this.platform === 'android' ? 'email-address' : 'default' }
                disableFullscreenUI={ true }
                allowFontScaling={ false }
                autoCapitalize={ 'none' }
                autoCorrect={ false }
                autoFocus={ false }
                spellCheck={ false }
            />
        );

        const userList = (
            <RX.View
                style={ [
                    styles.userListView,
                    { maxHeight: (TILE_HEIGHT + 1) * (this.state.userTiles?.length || 0) }
                ] }
            >
                <RX.ScrollView
                    style={ { width: this.platform === 'web' ? DIALOG_WIDTH + 30 : DIALOG_WIDTH } }
                    keyboardShouldPersistTaps={ 'always' }
                >
                    { this.state.userTiles }
                </RX.ScrollView>
            </RX.View>
        );

        let disabledStyle;
        if (this.state.isConfirmDisabled) {
            disabledStyle = RX.Styles.createTextStyle({
                color: MODAL_DISABLED_TEXT,
            }, false);
        }

        const buttons = (
            <RX.View
                style={ [
                    styles.buttonContainer,
                    { justifyContent: 'space-between' }
                ] }
            >
                <RX.Button
                    style={ styles.button }
                    onPress={ this.state.isSearch ? this.searchOnServer : this.createNewDirect }
                    disabledOpacity={ 1 }
                    disableTouchOpacityAnimation={ true }
                    disabled={ this.state.isConfirmDisabled }
                    activeOpacity={ 1 }
                >
                    <RX.Text allowFontScaling={ false } style={ [styles.buttonText, disabledStyle] }>
                        { this.state.isSearch ? searchUser[this.language] : inviteUser[this.language] }
                    </RX.Text>
                </RX.Button>

                <RX.Button
                    style={ styles.button }
                    onPress={ () => RX.Modal.dismissAll() }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    <RX.Text allowFontScaling={ false } style={ styles.buttonText }>
                        { cancel[this.language] }
                    </RX.Text>
                </RX.Button>
            </RX.View>

        )

        const content = (
            <RX.View style={ styles.container }>
                { this.state.infoTile || userList }
                { textInput }
                { buttons }
            </RX.View>
        );

        return (
            <KeyboardAwareView content={ content }/>
        );
    }
}
