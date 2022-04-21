import React from 'react';
import RX from 'reactxp';
import DataStore from '../stores/DataStore';
import { BUTTON_LONG_TEXT, BUTTON_LONG_BACKGROUND, BUTTON_LONG_WIDTH, FONT_LARGE, BUTTON_HEIGHT,
    BUTTON_MODAL_TEXT, TILE_MESSAGE_TEXT, OBJECT_MARGIN} from '../ui';
import { User } from '../models/User';
import ApiClient from '../matrix/ApiClient';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import DialogContainer from '../modules/DialogContainer';
import { acceptInvitation, rejectInvitation, hasInvitedYou } from '../translations';
import { ErrorResponse_, RoomType } from '../models/MatrixApi';
import SpinnerUtils from '../utils/SpinnerUtils';
import AppFont from '../modules/AppFont';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
        justifyContent: 'center',
    }),
    containerText: RX.Styles.createViewStyle({
        flex: 1,
        margin: OBJECT_MARGIN,
    }),
    containerButtons: RX.Styles.createViewStyle({
        flex: 1,
        alignItems: 'center',
    }),
    button: RX.Styles.createViewStyle({
        borderRadius: BUTTON_HEIGHT / 2,
        width: BUTTON_LONG_WIDTH,
        height: BUTTON_HEIGHT,
        backgroundColor: BUTTON_LONG_BACKGROUND,
        margin: OBJECT_MARGIN,
    }),
    buttonText: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_LARGE,
        textAlign: 'center',
        color: BUTTON_LONG_TEXT,
    }),
    text: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_LARGE,
        textAlign: 'center',
        color: TILE_MESSAGE_TEXT,
    }),
    errorDialog: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        textAlign: 'center',
        color: BUTTON_MODAL_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
};

interface InviteRoomProps extends RX.CommonProps {
    roomId: string;
    showRoomList: () => void;
}

interface InviteRoomState {
    offline: boolean;
}

export default class InviteRoom extends ComponentBase<InviteRoomProps, InviteRoomState> {

    private inviteSender: User;
    private roomType: RoomType;

    constructor(props: InviteRoomProps) {
        super(props);

        this.inviteSender = DataStore.getInviteSender(this.props.roomId);
        this.roomType = DataStore.getRoomType(this.props.roomId)!;
    }

    protected _buildState(): InviteRoomState {

        return {
            offline: UiStore.getOffline(),
        };
    }

    private onPressAccept = () => {

        SpinnerUtils.showModalSpinner('invitespinner');

        ApiClient.joinRoom(this.props.roomId)
            .catch((error: ErrorResponse_) => {

                SpinnerUtils.dismissModalSpinner('invitespinner');

                const text = (
                    <RX.Text style={ styles.errorDialog }>
                        { error.body && error.body.error ? error.body.error : '[Unknown error]' }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'errordialog');
            });
    }

    private onPressReject = () => {

        SpinnerUtils.showModalSpinner('invitespinner');

        ApiClient.leaveRoom(this.props.roomId)
            .then(_response => {

                SpinnerUtils.dismissModalSpinner('invitespinner');

                DataStore.removeRoom(this.props.roomId);

                this.props.showRoomList();
            })
            .catch((error: ErrorResponse_) => {

                SpinnerUtils.dismissModalSpinner('invitespinner');

                const text = (
                    <RX.Text style={ styles.errorDialog }>
                        { error.body && error.body.error ? error.body.error : '[Unknown error]' }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'errordialog');
            });
    }

    public render(): JSX.Element | null {

        const language = UiStore.getLanguage();

        return (
            <RX.View style={ styles.container }>
                <RX.View>
                    <RX.View style={ styles.containerText }>
                        <RX.Text style={ styles.text }>
                            <RX.Text style={ styles.text }>
                                { this.inviteSender.name }
                            </RX.Text>
                            <RX.Text style={ styles.text }>
                                { '  [' }
                            </RX.Text>
                            <RX.Text style={[styles.text, { fontWeight: 'bold' }]}>
                                { this.inviteSender.id }
                            </RX.Text>
                            <RX.Text style={ styles.text }>
                                { ']  ' }
                            </RX.Text>
                            <RX.Text style={ styles.text }>
                                {
                                    hasInvitedYou[language + '_' +
                                    this.roomType.substr(0, 2)]
                                }
                            </RX.Text>
                        </RX.Text>
                    </RX.View>
                    <RX.View style={ styles.containerButtons }>
                        <RX.Button
                            style={ styles.button }
                            onPress={ this.onPressAccept }
                            disableTouchOpacityAnimation={ true }
                            activeOpacity={ 1 }
                            disabled={ this.state.offline }
                            disabledOpacity={ 0.15 }
                        >
                            <RX.Text allowFontScaling={ false } style={ styles.buttonText }>
                                { acceptInvitation[language] }
                            </RX.Text>
                        </RX.Button>
                        <RX.Button
                            style={ styles.button }
                            onPress={ this.onPressReject }
                            disableTouchOpacityAnimation={ true }
                            activeOpacity={ 1 }
                            disabled={ this.state.offline }
                            disabledOpacity={ 0.15 }
                        >
                            <RX.Text allowFontScaling={ false } style={ styles.buttonText }>
                                { rejectInvitation[language] }
                            </RX.Text>
                        </RX.Button>
                    </RX.View>
                </RX.View>
            </RX.View>
        );
    }
}
