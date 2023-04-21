import React, { ReactElement } from 'react';
import RX from 'reactxp';
import DataStore from '../stores/DataStore';
import { User } from '../models/User';
import {
	BUTTON_HEIGHT,
	CONTENT_BACKGROUND,
	FONT_NORMAL,
	HEADER_HEIGHT,
	LABEL_TEXT,
	OBJECT_MARGIN,
	SPACING,
} from '../ui';
import AppFont from '../modules/AppFont';
import UserPresence from './UserPresence';
import ApiClient from '../matrix/ApiClient';
import AnimatedButton from './AnimatedButton';
import IconSvg, { SvgFile } from './IconSvg';
import { ComponentBase } from 'resub';
import { Msc3401Call } from '../models/Msc3401Call';
import { anyoneHere } from '../translations';
import UiStore from '../stores/UiStore';
import { MessageEventContent_ } from '../models/MatrixApi';

const USER_TILE_HEIGHT = 24;
const BUTTON_WIDTH = 24;
const MAX_LENGTH = 10;
const BORDER_RADIUS = 3;

const styles = {
	container: RX.Styles.createViewStyle({
		position: 'absolute',
		top: 2 * HEADER_HEIGHT,
		left: 1,
		alignItems: 'center',
	}),
	memberListContainer: RX.Styles.createViewStyle({
		flexDirection: 'row',
		maxHeight: MAX_LENGTH * USER_TILE_HEIGHT,
	}),
	maximizeIcon: RX.Styles.createViewStyle({
		transform: [{ rotate: '180deg' }],
	}),
	memberTile: RX.Styles.createViewStyle({
		flexDirection: 'row',
		height: USER_TILE_HEIGHT,
		borderWidth: 0,
		borderBottomWidth: 1,
		borderColor: 'gainsboro',
		backgroundColor: CONTENT_BACKGROUND,
		alignItems: 'center',
	}),
	memberTileText: RX.Styles.createTextStyle({
		marginLeft: SPACING,
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: LABEL_TEXT,
		width: 132,
	}),
	userPresence: RX.Styles.createViewStyle({
		margin: SPACING,
		width: 16,
		height: 16,
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'visible',
	}),
	rejectCallIcon: RX.Styles.createViewStyle({
		transform: [{ rotate: '135deg' }],
	}),
	pingButton: RX.Styles.createViewStyle({
		flexDirection: 'row',
		width: 148,
		height: BUTTON_HEIGHT,
		borderRadius: BUTTON_HEIGHT / 2,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#262626',
		padding: SPACING,
		marginTop: OBJECT_MARGIN,
	}),
	pingButtonText: RX.Styles.createTextStyle({
		flex: 1,
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: 'white',
		textAlign: 'center',
	}),
	pingIcon: RX.Styles.createViewStyle({
		marginRight: SPACING,
	}),
};

interface VideoconfMembersProps extends RX.CommonProps {
	roomId: string;
	startMinimized: boolean;
}

interface VideoconfMembersState {
	isMinimized: boolean;
	msc3401Call: Msc3401Call;
}

export default class VideoconfMembers extends ComponentBase<VideoconfMembersProps, VideoconfMembersState> {
	private members!: { [id: string]: User };
	private memberList: ReactElement[] = [];

	constructor(props: VideoconfMembersProps) {
		super(props);
	}

	protected _buildState(nextProps: VideoconfMembersProps, initState: boolean): Partial<VideoconfMembersState> {
		const partialState: Partial<VideoconfMembersState> = {};

		if (initState) {
			this.members = DataStore.getRoomSummary(nextProps.roomId).members;
			partialState.isMinimized = nextProps.startMinimized;
		}

		partialState.msc3401Call = DataStore.getMsc3401Call__(nextProps.roomId);

		return partialState;
	}

	private onPressMinimize = () => {
		this.setState({ isMinimized: true });
	};

	private onPressMaximize = () => {
		this.setState({ isMinimized: false });
	};

	private getMemberList = () => {
		this.memberList = [];
		Object.entries(this.members)
			.filter(
				member =>
					member[1].membership &&
					member[1].membership !== 'leave' &&
					member[1].id !== ApiClient.credentials.userIdFull
			)
			.map(member => {
				let icon: ReactElement | undefined;
				if (this.state.msc3401Call.participants![member[1].id] === undefined) {
					icon = (
						<UserPresence
							userId={member[1].id}
							bullet={true}
							bulletWidth={14}
						/>
					);
				} else if (this.state.msc3401Call.participants![member[1].id] === true) {
					icon = (
						<IconSvg
							source={require('../resources/svg/RI_call.json') as SvgFile}
							height={18}
							width={18}
							fillColor={'limegreen'}
						/>
					);
				} else {
					icon = (
						<IconSvg
							source={require('../resources/svg/RI_call.json') as SvgFile}
							style={styles.rejectCallIcon}
							height={18}
							width={18}
							fillColor={'red'}
						/>
					);
				}

				const memberTile = (
					<RX.View
						key={member[1].id}
						style={styles.memberTile}
					>
						<RX.Text
							numberOfLines={1}
							style={styles.memberTileText}
						>
							{member[1].id}
						</RX.Text>
						<RX.View style={styles.userPresence}>{icon}</RX.View>
					</RX.View>
				);

				this.memberList.push(memberTile);
			});
	};

	private onPressPingButton = () => {
		const content: MessageEventContent_ = {
			msgtype: 'm.text',
			body: anyoneHere[UiStore.getLanguage()],
		};
		const tempId = 'text' + Date.now();

		ApiClient.sendMessage(this.props.roomId, content, tempId).catch(_error => null);
	};

	public render(): JSX.Element | null {
		this.getMemberList();

		if (this.state.isMinimized) {
			return (
				<RX.View style={[styles.container, { height: this.memberList.length * USER_TILE_HEIGHT }]}>
					<AnimatedButton
						buttonStyle={{
							justifyContent: 'center',
							alignItems: 'center',
							width: BUTTON_WIDTH,
							backgroundColor: '#262626',
							borderTopRightRadius: BORDER_RADIUS,
							borderBottomRightRadius: BORDER_RADIUS,
							height: this.memberList.length * USER_TILE_HEIGHT,
							maxHeight: MAX_LENGTH * USER_TILE_HEIGHT,
						}}
						iconStyle={styles.maximizeIcon}
						iconSource={require('../resources/svg/RI_arrowleft.json') as SvgFile}
						iconFillColor={'white'}
						iconHeight={BUTTON_WIDTH}
						iconWidth={BUTTON_WIDTH}
						animatedColor={'white'}
						onPress={this.onPressMaximize}
					/>
				</RX.View>
			);
		}

		let pingButton;
		if (!this.props.startMinimized) {
			pingButton = (
				<AnimatedButton
					buttonStyle={styles.pingButton}
					text={'"' + anyoneHere[UiStore.getLanguage()] + '"'}
					textStyle={styles.pingButtonText}
					iconSource={require('../resources/svg/RI_send.json') as SvgFile}
					iconStyle={styles.pingIcon}
					iconFillColor={'white'}
					iconHeight={20}
					iconWidth={20}
					animatedColor={'white'}
					onPress={this.onPressPingButton}
				/>
			);
		}

		return (
			<RX.View style={styles.container}>
				<RX.View style={[styles.memberListContainer, { height: this.memberList.length * USER_TILE_HEIGHT }]}>
					<RX.ScrollView style={{ backgroundColor: undefined }}>{this.memberList}</RX.ScrollView>
					<AnimatedButton
						buttonStyle={{
							justifyContent: 'center',
							alignItems: 'center',
							width: BUTTON_WIDTH,
							backgroundColor: '#262626',
							borderTopRightRadius: BORDER_RADIUS,
							borderBottomRightRadius: BORDER_RADIUS,
							height: this.memberList.length * USER_TILE_HEIGHT,
							maxHeight: MAX_LENGTH * USER_TILE_HEIGHT,
						}}
						iconSource={require('../resources/svg/RI_arrowleft.json') as SvgFile}
						iconFillColor={'white'}
						iconHeight={BUTTON_WIDTH}
						iconWidth={BUTTON_WIDTH}
						animatedColor={'white'}
						onPress={this.onPressMinimize}
					/>
				</RX.View>
				{pingButton}
			</RX.View>
		);
	}
}
