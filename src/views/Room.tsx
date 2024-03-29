import React, { ReactElement } from 'react';
import RX from 'reactxp';
import Composer from '../components/Composer';
import RoomHeader from '../components/RoomHeader';
import RoomChat from '../components/RoomChat';
import DataStore from '../stores/DataStore';
import { ComponentBase } from 'resub';
import InviteRoom from '../components/InviteRoom';
import { RoomPhase, RoomType } from '../models/MatrixApi';
import SpinnerUtils from '../utils/SpinnerUtils';
import { FilteredChatEvent, TemporaryMessage } from '../models/FilteredChatEvent';
import ApiClient from '../matrix/ApiClient';

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
	replyMessage: FilteredChatEvent | undefined;
	onPressSendButton: (() => void) | undefined;
}

interface RoomProps extends RX.CommonProps {
	roomId: string;
	showLogin: () => void;
	showRoomList: () => void;
	showTempForwardedMessage: (roomId: string, message: FilteredChatEvent, tempId: string) => void;
	tempForwardedMessage?: { message: FilteredChatEvent; tempId: string };
	showVideoCall: (roomId: string) => void;
	showRoom: (roomId: string) => void;
}

export default class Room extends ComponentBase<RoomProps, RoomState> {
	protected _buildState(nextProps: RoomProps, initState: boolean): Partial<RoomState> {
		const roomPhase = DataStore.getRoomPhase(nextProps.roomId);
		const roomType = DataStore.getRoomType(nextProps.roomId);

		if (
			(initState || nextProps.roomId !== this.props.roomId) &&
			['direct', 'group'].includes(roomType!) &&
			DataStore.getPowerLevel_(nextProps.roomId, ApiClient.credentials.userIdFull) === 100 &&
			!DataStore.getMsc3401Ready(nextProps.roomId)
		) {
			ApiClient.getStateEventContent(nextProps.roomId, 'm.room.power_levels', '')
				.then(response => {
					const powerLevels = response;
					powerLevels.events['org.matrix.msc3401.call'] = 0;
					powerLevels.events['org.matrix.msc3401.call.member'] = 0;

					ApiClient.sendStateEvent(nextProps.roomId, 'm.room.power_levels', powerLevels, '').catch(
						_error => null
					);
				})
				.catch(_error => null);
		}

		if ((!roomPhase || !roomType) && !SpinnerUtils.isDisplayed('roomspinner')) {
			SpinnerUtils.showModalSpinner('roomspinner');
		} else if (roomType && roomPhase && SpinnerUtils.isDisplayed('roomspinner')) {
			SpinnerUtils.dismissModalSpinner('roomspinner');
		}

		if (roomPhase === 'join' && SpinnerUtils.isDisplayed('invitespinner')) {
			SpinnerUtils.dismissModalSpinner('invitespinner');
		}

		return {
			roomPhase: roomPhase,
			roomType: roomType,
			roomActive: DataStore.getRoomActive(nextProps.roomId),
		};
	}

	private showTempSentMessage = (message: TemporaryMessage) => {
		this.setState({
			tempSentMessage: { body: message.body, tempId: message.tempId },
			replyMessage: undefined,
		});
	};

	private setReplyMessage = (message: FilteredChatEvent) => {
		this.setState({ replyMessage: message });
	};

	private floatingSendButton = (onPressSendButton: (() => void) | undefined) => {
		if (onPressSendButton && !this.state.onPressSendButton) {
			this.setState({ onPressSendButton: onPressSendButton });
		} else if (!onPressSendButton && this.state.onPressSendButton) {
			this.setState({ onPressSendButton: undefined });
		}
	};

	public render(): JSX.Element | null {
		if (!this.state.roomPhase) {
			return null;
		}

		let composer: ReactElement | undefined;
		let roomChat: ReactElement | undefined;

		if (this.state.roomPhase === 'join') {
			composer = (
				<Composer
					roomId={this.props.roomId}
					roomType={this.state.roomType}
					showTempSentMessage={this.showTempSentMessage}
					replyMessage={this.state.replyMessage!}
					showVideoCall={this.props.showVideoCall}
					roomActive={this.state.roomActive}
					floatingSendButton={this.floatingSendButton}
				/>
			);

			roomChat = (
				<RoomChat
					roomId={this.props.roomId}
					roomType={this.state.roomType}
					tempSentMessage={this.state.tempSentMessage}
					setReplyMessage={this.setReplyMessage}
					showTempForwardedMessage={this.props.showTempForwardedMessage}
					tempForwardedMessage={this.props.tempForwardedMessage!}
					onPressSendButton={this.state.onPressSendButton}
					showVideoCall={this.props.showVideoCall}
				/>
			);
		} else if (this.state.roomPhase === 'invite') {
			roomChat = (
				<InviteRoom
					roomId={this.props.roomId}
					showRoomList={this.props.showRoomList}
				/>
			);
		}

		return (
			<RX.View style={styles.container}>
				<RoomHeader
					showLogin={this.props.showLogin}
					showRoomList={this.props.showRoomList}
					roomId={this.props.roomId}
					showRoom={this.props.showRoom}
				/>
				{composer}
				{roomChat}
			</RX.View>
		);
	}
}
