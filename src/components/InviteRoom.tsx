import React from 'react';
import RX from 'reactxp';
import DataStore from '../stores/DataStore';
import {
	BUTTON_LONG_TEXT,
	BUTTON_LONG_BACKGROUND,
	BUTTON_LONG_WIDTH,
	FONT_LARGE,
	BUTTON_HEIGHT,
	BUTTON_MODAL_TEXT,
	TILE_MESSAGE_TEXT,
	OBJECT_MARGIN,
	CONTENT_BACKGROUND,
	SPACING,
} from '../ui';
import { User } from '../models/User';
import ApiClient from '../matrix/ApiClient';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import DialogContainer from '../modules/DialogContainer';
import { acceptInvitation, rejectInvitation, hasInvitedYou } from '../translations';
import { ErrorResponse_, RoomType } from '../models/MatrixApi';
import SpinnerUtils from '../utils/SpinnerUtils';
import AppFont from '../modules/AppFont';
import AnimatedButton from './AnimatedButton';
import { SvgFile } from './IconSvg';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		justifyContent: 'center',
		backgroundColor: CONTENT_BACKGROUND,
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
		flexDirection: 'row',
		alignItems: 'center',
		padding: SPACING,
		borderRadius: BUTTON_HEIGHT / 2,
		width: BUTTON_LONG_WIDTH,
		height: BUTTON_HEIGHT,
		backgroundColor: BUTTON_LONG_BACKGROUND,
		margin: OBJECT_MARGIN,
		shadowOffset: { width: 1, height: 1 },
		shadowColor: 'grey',
		shadowRadius: 3,
		elevation: 3,
		shadowOpacity: 1,
		overflow: 'visible',
	}),
	buttonText: RX.Styles.createTextStyle({
		flex: 1,
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

		ApiClient.joinRoom(this.props.roomId).catch((error: ErrorResponse_) => {
			SpinnerUtils.dismissModalSpinner('invitespinner');

			const text = (
				<RX.Text style={styles.errorDialog}>
					{error.body && error.body.error ? error.body.error : '[Unknown error]'}
				</RX.Text>
			);

			RX.Modal.show(<DialogContainer content={text} />, 'errordialog');
		});
	};

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
					<RX.Text style={styles.errorDialog}>
						{error.body && error.body.error ? error.body.error : '[Unknown error]'}
					</RX.Text>
				);

				RX.Modal.show(<DialogContainer content={text} />, 'errordialog');
			});
	};

	public render(): JSX.Element | null {
		const language = UiStore.getLanguage();

		return (
			<RX.View style={styles.container}>
				<RX.View>
					<RX.View style={styles.containerText}>
						<RX.Text style={styles.text}>
							<RX.Text style={styles.text}>{this.inviteSender.name}</RX.Text>
							<RX.Text style={styles.text}>{'  ['}</RX.Text>
							<RX.Text style={[styles.text, { fontWeight: 'bold' }]}>{this.inviteSender.id}</RX.Text>
							<RX.Text style={styles.text}>{']  '}</RX.Text>
							<RX.Text style={styles.text}>
								{hasInvitedYou[language + '_' + this.roomType.substr(0, 2)]}
							</RX.Text>
						</RX.Text>
					</RX.View>
					<RX.View style={styles.containerButtons}>
						<AnimatedButton
							buttonStyle={styles.button}
							iconSource={require('../resources/svg/RI_checksingle.json') as SvgFile}
							iconStyle={{ position: 'absolute', right: SPACING, opacity: this.state.offline ? 0.3 : 1 }}
							iconFillColor={'limegreen'}
							iconHeight={24}
							iconWidth={24}
							animatedColor={'white'}
							onPress={this.onPressAccept}
							disabled={this.state.offline}
							text={acceptInvitation[language]}
							textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
						/>
						<AnimatedButton
							buttonStyle={styles.button}
							iconSource={require('../resources/svg/RI_cancel.json') as SvgFile}
							iconStyle={{ position: 'absolute', right: SPACING, opacity: this.state.offline ? 0.3 : 1 }}
							iconFillColor={'red'}
							iconHeight={24}
							iconWidth={24}
							animatedColor={'white'}
							onPress={this.onPressReject}
							disabled={this.state.offline}
							text={rejectInvitation[language]}
							textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
						/>
					</RX.View>
				</RX.View>
			</RX.View>
		);
	}
}
