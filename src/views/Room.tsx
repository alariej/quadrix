import React, { ReactElement } from 'react';
import RX from 'reactxp';
import Composer from '../components/Composer';
import RoomHeader from '../components/RoomHeader';
import RoomChat from '../components/RoomChat';
import DataStore from '../stores/DataStore';
import { ComponentBase } from 'resub';
import InviteRoom from '../components/InviteRoom';
import ModalSpinner from '../components/ModalSpinner';
import { MessageEvent, TemporaryMessage } from '../models/MessageEvent';
import { RoomPhase, RoomType } from '../models/MatrixApi';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
    }),
};

interface RoomState {
    tempSentMessage: TemporaryMessage;
    roomPhase: RoomPhase;
    roomType: RoomType;
    roomActive: boolean;
    replyMessage: TemporaryMessage | undefined;
}

interface RoomProps extends RX.CommonProps {
    roomId: string;
    showLogin: () => void;
    showRoomList: () => void;
    showTempForwardedMessage: (roomId: string, message: MessageEvent, tempId: string) => void;
    tempForwardedMessage?: { message: MessageEvent, tempId: string };
    showJitsiMeet: (jitsiMeetId: string) => void;
}

export default class Room extends ComponentBase<RoomProps, RoomState> {

    protected _buildState(nextProps: RoomProps): Partial<RoomState> {

        const roomPhase = DataStore.getRoomPhase(nextProps.roomId);
        const roomType = DataStore.getRoomType(nextProps.roomId);

        if ((!roomPhase || !roomType) && !RX.Modal.isDisplayed('modalspinner')) {

            RX.Modal.show(<ModalSpinner />, 'modalspinner');

        } else if (roomType && roomPhase && RX.Modal.isDisplayed('modalspinner')) {

            RX.Modal.dismiss('modalspinner');
        }

        if (roomPhase === 'join' && RX.Modal.isDisplayed('invitemodalspinner')) {

            RX.Modal.dismiss('invitemodalspinner');
        }

        return {
            roomPhase: roomPhase,
            roomType: roomType,
            roomActive: DataStore.getRoomActive(nextProps.roomId),
        };
    }

    private showTempSentMessage = (message: TemporaryMessage) => {

        this.setState({ tempSentMessage: { body: message.body, tempId: message.tempId } });
        this.setState({ replyMessage: undefined });
    }

    private setReplyMessage = (message: TemporaryMessage) => {

        this.setState({ replyMessage: message });
    }

    public render(): JSX.Element | null {

        if (!this.state.roomPhase) { return null }

        let composer: ReactElement | undefined;
        let roomChat: ReactElement | undefined;

        if (this.state.roomPhase === 'join') {

            composer = (
                <Composer
                    roomId={ this.props.roomId }
                    roomType={ this.state.roomType }
                    showTempSentMessage={ this.showTempSentMessage }
                    replyMessage={ this.state.replyMessage! }
                    showJitsiMeet={ this.props.showJitsiMeet }
                    roomActive={ this.state.roomActive }
                />
            );

            roomChat = (
                <RoomChat
                    roomId={ this.props.roomId }
                    roomType={ this.state.roomType }
                    tempSentMessage={ this.state.tempSentMessage }
                    setReplyMessage={ this.setReplyMessage }
                    showTempForwardedMessage={ this.props.showTempForwardedMessage }
                    tempForwardedMessage={ this.props.tempForwardedMessage! }
                />
            );
        } else if (this.state.roomPhase === 'invite') {

            roomChat = (
                <InviteRoom
                    roomId={ this.props.roomId }
                    showRoomList={ this.props.showRoomList }
                />
            );
        }

        return (
            <RX.View style={ styles.container }>

                <RoomHeader
                    showLogin={ this.props.showLogin }
                    showRoomList={ this.props.showRoomList }
                    roomId={ this.props.roomId }
                />

                { composer }

                { roomChat }

            </RX.View>
        );
    }
}
