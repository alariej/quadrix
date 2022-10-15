import React, { ReactElement } from 'react';
import RX from 'reactxp';
import {
	BUTTON_UNREAD_BACKGROUND,
	OPAQUE_DUMMY_BACKGROUND,
	MODAL_CONTENT_TEXT,
	BUTTON_LONG_TEXT,
	BORDER_RADIUS,
	BUTTON_LONG_WIDTH,
	BUTTON_HEIGHT,
	BUTTON_ROUND_WIDTH,
	FONT_NORMAL,
	SPACING,
	FONT_LARGE,
	BUTTON_FILL,
	MESSAGE_HEIGHT_DEFAULT,
	LIGHT_BACKGROUND,
	OBJECT_MARGIN,
	TRANSPARENT_BACKGROUND,
	HEADER_STATUS,
	BUTTON_UNREAD_TEXT,
} from '../ui';
import { MESSAGE_COUNT_ADD } from '../appconfig';
import { ComponentBase } from 'resub';
import DataStore from '../stores/DataStore';
import {
	VirtualListView,
	VirtualListViewCellRenderDetails,
	VirtualListViewItemInfo,
} from '../components/VirtualListView';
import MessageTile from './MessageTile';
import ApiClient from '../matrix/ApiClient';
import EventUtils from '../utils/EventUtils';
import { MessageEvent, TemporaryMessage } from '../models/MessageEvent';
import { MessageEventContent_, RoomType } from '../models/MatrixApi';
import SystemMessage from './SystemMessage';
import DialogContainer from '../modules/DialogContainer';
import UiStore from '../stores/UiStore';
import { yesterdayWord, fetchingMessages, noMoreMessages, Languages, errorLoadingMessages } from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import { differenceInDays, format, isSameYear, isToday, isYesterday, Locale } from 'date-fns';
import Spinner from './Spinner';
import AppFont from '../modules/AppFont';
import StringUtils from '../utils/StringUtils';
import FloatingSendButton from '../modules/FloatingSendButton';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		borderRadius: BORDER_RADIUS,
	}),
	arrowButton: RX.Styles.createViewStyle({
		position: 'absolute',
		top: 12,
		right: 12,
		borderRadius: BUTTON_ROUND_WIDTH / 2,
		width: BUTTON_ROUND_WIDTH,
		height: BUTTON_ROUND_WIDTH,
		backgroundColor: TRANSPARENT_BACKGROUND,
		justifyContent: 'center',
		alignItems: 'center',
		cursor: 'pointer',
	}),
	moreButton: RX.Styles.createViewStyle({
		position: 'absolute',
		bottom: 12,
		right: 12,
		borderRadius: BUTTON_ROUND_WIDTH / 2,
		width: BUTTON_ROUND_WIDTH,
		height: BUTTON_ROUND_WIDTH,
		backgroundColor: TRANSPARENT_BACKGROUND,
		justifyContent: 'center',
		alignItems: 'center',
		cursor: 'pointer',
	}),
	containerLoadingButton: RX.Styles.createViewStyle({
		position: 'absolute',
		bottom: 0,
		alignSelf: 'center',
	}),
	loadingButton: RX.Styles.createViewStyle({
		flexDirection: 'row',
		width: BUTTON_LONG_WIDTH,
		height: BUTTON_HEIGHT,
		borderRadius: BUTTON_HEIGHT / 2,
		backgroundColor: LIGHT_BACKGROUND,
		justifyContent: 'center',
		alignItems: 'center',
	}),
	loadingButtonText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: BUTTON_LONG_TEXT,
	}),
	spinner: RX.Styles.createViewStyle({
		position: 'absolute',
		right: OBJECT_MARGIN,
	}),
	containerWrapper: RX.Styles.createViewStyle({
		flex: 1,
		backgroundColor: OPAQUE_DUMMY_BACKGROUND,
	}),
	containerDate: RX.Styles.createViewStyle({
		alignSelf: 'center',
		marginTop: OBJECT_MARGIN - SPACING,
		marginBottom: OBJECT_MARGIN,
	}),
	date: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: HEADER_STATUS,
	}),
	textDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		color: MODAL_CONTENT_TEXT,
		fontSize: FONT_LARGE,
		margin: 12,
	}),
};

interface EventListItemInfo extends VirtualListViewItemInfo {
	event: MessageEvent;
	readMarkerType: string;
	isRedacted?: boolean;
	body?: string;
}

interface RoomChatState {
	eventListItems: EventListItemInfo[];
	showArrowButton: boolean;
	showMoreButton: boolean;
	showLoadingButton: boolean;
	showNewMessageButton: boolean;
	offline: boolean;
}

interface RoomChatProps extends RX.CommonProps {
	roomId: string;
	roomType: RoomType;
	tempSentMessage: TemporaryMessage;
	setReplyMessage: (message: MessageEvent) => void;
	showTempForwardedMessage: (roomId: string, message: MessageEvent, tempId: string) => void;
	tempForwardedMessage: { message: MessageEvent; tempId: string };
	onPressSendButton: (() => void) | undefined;
}

export default class RoomChat extends ComponentBase<RoomChatProps, RoomChatState> {
	private eventListItems: EventListItemInfo[] = [];
	private virtualListView: VirtualListView<VirtualListViewItemInfo> | undefined;
	private endToken = '';
	private timelineLimited = false;
	private newMessageSubscription: number;
	private newReadReceiptSubscription: number;
	private readMarkerTime = 0;
	private language: Languages = 'en';
	private locale: Locale;

	constructor(props: RoomChatProps) {
		super(props);

		this.newMessageSubscription = DataStore.subscribe(this.newMessages, DataStore.MessageTrigger);
		this.newReadReceiptSubscription = DataStore.subscribe(this.newReadReceipt, DataStore.ReadReceiptTrigger);

		this.language = UiStore.getLanguage();
		this.locale = UiStore.getLocale();
	}

	protected _buildState(nextProps: RoomChatProps, initState: boolean): Partial<RoomChatState> | undefined {
		const partialState: Partial<RoomChatState> = {};

		partialState.offline = UiStore.getOffline();

		if (initState || this.props.roomId !== nextProps.roomId) {
			this.readMarkerTime = DataStore.getReadMarker(nextProps.roomId);

			const roomEvents = DataStore.getAllRoomEvents(nextProps.roomId);
			this.eventListItems = [];

			for (let i = 0; i < roomEvents.length; i++) {
				const event = roomEvents[i];

				if (event.type === 'm.room.redaction') {
					const eventIndex = roomEvents.findIndex(event_ => event_.eventId === event.redacts);
					if (eventIndex > -1) {
						roomEvents[eventIndex].isRedacted = true;
					}
				} else if (event.content['m.relates_to']?.rel_type === 'm.replace') {
					const editedEventId = event.content['m.relates_to'].event_id;
					const eventIndex = roomEvents.findIndex(event_ => event_.eventId === editedEventId);
					if (eventIndex > -1) {
						if (event.time > (roomEvents[eventIndex].content._time || 0)) {
							roomEvents[eventIndex].content = event.content['m.new_content']!;
						}
						roomEvents[eventIndex].isEdited = true;
						roomEvents[eventIndex].content._time = event.time;
					}
				} else {
					const messageInfo: EventListItemInfo = {
						key: event.eventId + '_' + Math.random(),
						height: MESSAGE_HEIGHT_DEFAULT,
						template: 'event',
						measureHeight: true,
						event: event,
						readMarkerType: event.time > this.readMarkerTime ? 'sent' : 'read',
						isRedacted: event.isRedacted,
						body: event.content.body,
					};

					this.eventListItems.push(messageInfo);
				}
			}

			this.endToken = DataStore.getTimelineToken(nextProps.roomId)!;
			this.timelineLimited = DataStore.getTimelineLimited(nextProps.roomId)!;

			if (nextProps.tempForwardedMessage && nextProps.tempForwardedMessage.message) {
				const content = nextProps.tempForwardedMessage.message.content;

				let body: string | undefined;
				if (content.msgtype === 'm.text') {
					body = content.body;
				} else {
					body = '[Sending ' + content.body! + ']';
				}

				partialState.eventListItems = this.createTempEventListItems(
					body!,
					nextProps.tempForwardedMessage.tempId
				);
			} else {
				partialState.eventListItems = this.eventListItems;
			}

			partialState.showArrowButton = false;
			partialState.showLoadingButton = false;
			partialState.showNewMessageButton = false;
			partialState.showMoreButton = false;

			if (!partialState.offline) {
				this.sendInitialReadReceipt();
			}

			if (!initState && this.virtualListView) {
				this.virtualListView.scrollToTop(true, 0);
			}
		} else if (nextProps.tempSentMessage !== this.props.tempSentMessage) {
			const body = nextProps.tempSentMessage.body;
			const tempId = nextProps.tempSentMessage.tempId;
			const body_ = this.props.tempSentMessage ? this.props.tempSentMessage.body : undefined;
			const tempId_ = this.props.tempSentMessage ? this.props.tempSentMessage.tempId : undefined;

			if (body && (!body_ || tempId !== tempId_)) {
				partialState.eventListItems = this.createTempEventListItems(body, tempId!);
			} else if (!body && body_ && tempId === tempId_) {
				partialState.eventListItems = this.eventListItems;
			}
		} else if (
			nextProps.tempForwardedMessage &&
			nextProps.tempForwardedMessage !== this.props.tempForwardedMessage
		) {
			const content = nextProps.tempForwardedMessage.message.content;
			const tempId = nextProps.tempForwardedMessage.tempId;
			const content_ = this.props.tempForwardedMessage
				? this.props.tempForwardedMessage.message.content
				: undefined;
			const tempId_ = this.props.tempForwardedMessage ? this.props.tempForwardedMessage.tempId : undefined;

			if (content) {
				let body: string | undefined;
				if (content.msgtype === 'm.text') {
					body = content.body;
				} else {
					body = '[Sending ' + content.body! + ']';
				}

				partialState.eventListItems = this.createTempEventListItems(
					body!,
					nextProps.tempForwardedMessage.tempId
				);
			} else if (!content && content_ && tempId === tempId_) {
				partialState.eventListItems = this.eventListItems;
			}
		}

		return partialState;
	}

	public componentDidMount(): void {
		super.componentDidMount();

		if (this.virtualListView) {
			this.virtualListView.scrollToTop(true, 0);
		}
	}

	public componentWillUnmount(): void {
		super.componentWillUnmount();

		DataStore.unsubscribe(this.newMessageSubscription);
		DataStore.unsubscribe(this.newReadReceiptSubscription);
	}

	private createTempEventListItems = (body: string, tempId: string): EventListItemInfo[] => {
		// check if the forwarded message is already somewhere near the top of the message list..
		for (let i = 0; i < Math.min(5, this.eventListItems.length); i++) {
			if (this.eventListItems[i].event.tempId === tempId) {
				return this.eventListItems;
			}
		}

		const eventContent: MessageEventContent_ = {
			msgtype: 'm.text',
			body: body,
		};

		const tempMessageEvent: MessageEvent = {
			eventId: tempId,
			content: eventContent,
			type: 'm.room.message',
			time: Date.now(),
			senderId: ApiClient.credentials.userIdFull,
			tempId: 'tempSentMessage',
		};

		const tempMessageInfo: EventListItemInfo = {
			key: tempId,
			height: MESSAGE_HEIGHT_DEFAULT,
			template: 'event',
			measureHeight: true,
			event: tempMessageEvent,
			readMarkerType: 'sending',
		};

		return [tempMessageInfo].concat(this.eventListItems);
	};

	private newMessages = () => {
		const newRoomEvents = DataStore.getNewRoomEvents(this.props.roomId);
		const newEventsLimited = DataStore.getNewEventsLimited(this.props.roomId);

		if (newRoomEvents.length === 0) {
			return;
		}

		const newEventListItems: EventListItemInfo[] = [];

		for (let i = 0; i < newRoomEvents.length; i++) {
			const event = newRoomEvents[i];

			if (event.type === 'm.room.redaction') {
				const eventIndex = this.eventListItems.findIndex(item => item.event.eventId === event.redacts);
				if (eventIndex > -1) {
					this.eventListItems[eventIndex].isRedacted = true;
				}
			} else if (event.content['m.relates_to']?.rel_type === 'm.replace') {
				const editedEventId = event.content['m.relates_to'].event_id;
				const eventIndex = this.eventListItems.findIndex(item => item.event.eventId === editedEventId);
				if (eventIndex > -1) {
					this.eventListItems[eventIndex].event.content = event.content['m.new_content']!;
					this.eventListItems[eventIndex].body = event.content['m.new_content']?.body;
					this.eventListItems[eventIndex].event.isEdited = true;
					this.eventListItems[eventIndex].event.content._time = event.time;
				}
			} else {
				const messageInfo: EventListItemInfo = {
					key: event.tempId || event.eventId + '_' + Math.random(),
					height: MESSAGE_HEIGHT_DEFAULT,
					template: 'event',
					measureHeight: true,
					event: event,
					readMarkerType: event.time > this.readMarkerTime ? 'sent' : 'read',
				};

				newEventListItems.push(messageInfo);
			}
		}

		// sometimes, a new event is sent twice by the server, with a delay of up to 10 seconds in between
		// shouldn't this be picked up in the datastore?
		if (newEventListItems.length > 0 && newRoomEvents[0].eventId !== this.eventListItems[0].event.eventId) {
			if (newEventsLimited) {
				this.eventListItems = newEventListItems;
				this.endToken = DataStore.getTimelineToken(this.props.roomId)!;
				this.timelineLimited = true;
			} else {
				this.eventListItems = newEventListItems.concat(this.eventListItems);
			}
			// voodoo: although unshift does the same as concat, it crashes the VLV
			// with error: Active Cell not found for key...
			// this.eventListItems.unshift(newEventInfo);

			if (this.state.showArrowButton) {
				this.setState({ showNewMessageButton: true });
			}

			/*
            According to the ReactXP doc, the VLV should not move when items get added to the top of the list
            while being outside the viewport. This prevents the VLV to jerk or jump as users have
            scrolled down to view older items. From the doc:
            "When items are added before or after the visible region,
            it attempts to maintain the current position of the visible items,
            adjusting the scroll position and list height as necessary."
            Unfortunately it doesn't work. To remedy that problem, the state change is only triggered
            if user is close to the top of the list, and actualised when user either scrolls back up,
            or presses the Up button.
            */
		} else {
			// HACK: need to cut and repaste the last message to force a re-render of the VLV
			// voodoo: although push does the same as concat, VLV does not update
			const lastItem = this.eventListItems.pop();
			this.eventListItems = this.eventListItems.concat(lastItem!);
		}
		if (!this.state.showArrowButton) {
			ApiClient.sendReadReceipt(this.props.roomId, newRoomEvents[0].eventId).catch(_error => null);
			this.setState({ eventListItems: this.eventListItems });
		}
	};

	private newReadReceipt = () => {
		const readMarkerTime = DataStore.getReadMarker(this.props.roomId);

		if (readMarkerTime > this.readMarkerTime) {
			this.readMarkerTime = readMarkerTime;

			let newReadItem = false;

			for (let i = 0; i < this.eventListItems.length; i++) {
				if (this.eventListItems[i].readMarkerType === 'read') {
					break;
				} else if (this.readMarkerTime >= this.eventListItems[i].event.time) {
					newReadItem = true;
					this.eventListItems[i].readMarkerType = 'read';
				}
			}

			if (newReadItem) {
				// HACK: need to cut and repaste the last message to force a re-render of the VLV
				// voodoo: although push does the same as concat, VLV does not update
				const lastItem = this.eventListItems.pop();
				this.eventListItems = this.eventListItems.concat(lastItem!);

				if (!this.state.showArrowButton) {
					this.setState({ eventListItems: this.eventListItems });
				}
			}
		}
	};

	private sendInitialReadReceipt = () => {
		this.eventListItems.some(item => {
			if (item.event.senderId !== ApiClient.credentials.userIdFull) {
				ApiClient.sendReadReceipt(this.props.roomId, item.event.eventId).catch(_error => null);
				return true;
			}
			return false;
		});
	};

	private gotoMessage = (eventId: string) => {
		this.virtualListView?.selectItemKey(eventId, true);
	};

	private renderItem = (cellRender: VirtualListViewCellRenderDetails<EventListItemInfo>): ReactElement => {
		let dateTile: ReactElement | undefined;
		let messageDateString = '';

		if (cellRender.item.event.dateChangeFlag && !isToday(cellRender.item.event.time)) {
			if (isYesterday(cellRender.item.event.time)) {
				messageDateString = yesterdayWord[this.language];
			} else if (
				!isSameYear(new Date(), cellRender.item.event.time) &&
				differenceInDays(new Date(), cellRender.item.event.time) > 180
			) {
				messageDateString = format(cellRender.item.event.time, 'd MMMM yyyy', { locale: this.locale });
			} else {
				messageDateString = format(cellRender.item.event.time, 'EEEE, d MMMM', { locale: this.locale });
			}

			dateTile = (
				<RX.View style={styles.containerDate}>
					<RX.Text style={styles.date}>{messageDateString}</RX.Text>
				</RX.View>
			);
		}

		let MessageWrapper: ReactElement;

		if (['m.room.message', 'm.room.encrypted'].includes(cellRender.item.event.type)) {
			let replyEvent: MessageEvent | undefined;

			const replyEventId = cellRender.item.event.content['m.relates_to']?.['m.in_reply_to']?.event_id;

			if (replyEventId) {
				const eventIndex = this.eventListItems.findIndex(
					(item: EventListItemInfo) => item.event.eventId === replyEventId
				);
				replyEvent = this.eventListItems[eventIndex]?.event;

				if (!replyEvent) {
					const fallback = StringUtils.getReplyFallback(cellRender.item.event.content.body!);

					if (fallback.senderId && fallback.message) {
						replyEvent = {
							eventId: replyEventId,
							content: {
								body: fallback.message,
								msgtype: 'm.text',
							},
							type: 'm.message',
							time: 0,
							senderId: fallback.senderId,
						};
					}
				}
			}

			MessageWrapper = (
				<RX.View
					style={styles.containerWrapper}
					onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					{dateTile}
					<MessageTile
						roomId={this.props.roomId}
						event={cellRender.item.event}
						roomType={this.props.roomType}
						readMarkerType={cellRender.item.readMarkerType}
						replyMessage={replyEvent}
						setReplyMessage={this.props.setReplyMessage}
						onPressReply={this.gotoMessage}
						showTempForwardedMessage={this.props.showTempForwardedMessage}
						canPress={true}
						isRedacted={cellRender.item.isRedacted || false}
						body={cellRender.item.event.content?.body}
						animatedImage={true}
					/>
				</RX.View>
			);
		} else {
			const systemMessage = EventUtils.getSystemMessage(cellRender.item.event, this.props.roomType);

			MessageWrapper = (
				<RX.View
					style={styles.containerWrapper}
					onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					{dateTile}
					<SystemMessage systemMessage={systemMessage} />
				</RX.View>
			);
		}

		return MessageWrapper;
	};

	private onScroll = (scrollHeight: number) => {
		if (!this.state.showArrowButton && scrollHeight > 100) {
			this.setState({ showArrowButton: true });
		} else if (this.state.showArrowButton && scrollHeight <= 100) {
			ApiClient.sendReadReceipt(this.props.roomId, this.eventListItems[0].event.eventId).catch(_error => null);
			this.setState({
				eventListItems: this.eventListItems,
				showArrowButton: false,
				showNewMessageButton: false,
			});
		}

		const distanceToBottom =
			// @ts-ignore
			this.virtualListView!._containerHeight - scrollHeight - this.virtualListView!._layoutHeight;

		if (!this.state.showMoreButton && !this.state.showLoadingButton && distanceToBottom < 120) {
			if ((this.endToken && this.timelineLimited) || this.props.roomType === 'community') {
				this.setState({ showMoreButton: true });
			}
		} else if (this.state.showMoreButton && distanceToBottom >= 120) {
			this.setState({ showMoreButton: false });
		}
	};

	private onPressArrowButton = () => {
		this.virtualListView!.scrollToTop(true, 0);
		ApiClient.sendReadReceipt(this.props.roomId, this.eventListItems[0].event.eventId).catch(_error => null);
		this.setState({ eventListItems: this.eventListItems });
	};

	private onPressMoreButton = () => {
		this.setState({
			showMoreButton: false,
			showLoadingButton: true,
		});

		const previousEventTime =
			this.eventListItems.length > 0 ? this.eventListItems[this.eventListItems.length - 1].event.time : 0;

		ApiClient.getRoomEvents(
			this.props.roomId,
			this.props.roomType,
			MESSAGE_COUNT_ADD,
			this.endToken,
			previousEventTime
		)
			.then(response => {
				this.timelineLimited = response.timelineLimited;
				this.endToken = response.endToken;

				if (response.events.length === 0) {
					const text = <RX.Text style={styles.textDialog}>{noMoreMessages[this.language]}</RX.Text>;

					RX.Modal.show(<DialogContainer content={text} />, 'modaldialog');

					this.setState({ showLoadingButton: false });
					return;
				}

				const olderEventListItems: EventListItemInfo[] = [];

				for (let i = 0; i < response.events.length; i++) {
					const event = response.events[i];

					if (event.content['m.relates_to']?.rel_type === 'm.replace') {
						// just ignore edits, and assume edited content is already in the original message?
					} else {
						const messageInfo: EventListItemInfo = {
							key: event.eventId + '_' + Math.random(),
							height: MESSAGE_HEIGHT_DEFAULT,
							template: 'event',
							measureHeight: true,
							event: event,
							readMarkerType: event.time > this.readMarkerTime ? 'sent' : 'read',
							isRedacted: event.isRedacted,
							body: event.content.body,
						};
						olderEventListItems.push(messageInfo);
					}
				}

				this.eventListItems = this.eventListItems.concat(olderEventListItems);

				this.setState({
					eventListItems: this.eventListItems,
					showLoadingButton: false,
				});
			})
			.catch(_error => {
				const text = <RX.Text style={styles.textDialog}>{errorLoadingMessages[this.language]}</RX.Text>;

				RX.Modal.show(<DialogContainer content={text} />, 'modaldialog');

				this.setState({ showLoadingButton: false });
			});
	};

	private onLayout = () => {
		const showMoreButton = () => {
			if (!this.virtualListView) {
				return;
			}

			// @ts-ignore
			const isNoScroll = this.virtualListView._heightOfRenderBlock < this.virtualListView._layoutHeight;

			if (isNoScroll && this.endToken && this.timelineLimited) {
				this.setState({ showMoreButton: true });
			}
		};

		setTimeout(showMoreButton, 1000);
	};

	public render(): JSX.Element | null {
		if (!this.props.roomType) {
			return null;
		}

		let arrowButton: ReactElement | undefined;

		if (this.state.showArrowButton) {
			const iconColor = this.state.showNewMessageButton ? BUTTON_UNREAD_BACKGROUND : BUTTON_FILL;

			arrowButton = (
				<RX.Button
					style={styles.arrowButton}
					onPress={this.onPressArrowButton}
					disableTouchOpacityAnimation={false}
					underlayColor={iconColor}
					activeOpacity={0.8}
				>
					<IconSvg
						source={require('../resources/svg/RI_arrowup.json') as SvgFile}
						style={{ backgroundColor: iconColor, borderRadius: BORDER_RADIUS }}
						fillColor={BUTTON_UNREAD_TEXT}
						height={20}
						width={20}
					/>
				</RX.Button>
			);
		}

		let moreButton: ReactElement | undefined;

		if (this.state.showMoreButton) {
			moreButton = (
				<RX.Button
					style={styles.moreButton}
					onPress={this.onPressMoreButton}
					disableTouchOpacityAnimation={false}
					underlayColor={BUTTON_FILL}
					activeOpacity={0.8}
					disabled={this.state.offline}
					disabledOpacity={0.15}
				>
					<IconSvg
						source={require('../resources/svg/RI_more.json') as SvgFile}
						style={{ backgroundColor: BUTTON_FILL, borderRadius: BORDER_RADIUS }}
						fillColor={BUTTON_UNREAD_TEXT}
						height={20}
						width={20}
					/>
				</RX.Button>
			);
		}

		let loadingButton: ReactElement | undefined;

		if (this.state.showLoadingButton) {
			loadingButton = (
				<RX.View style={styles.containerLoadingButton}>
					<RX.View style={styles.loadingButton}>
						<RX.Text
							allowFontScaling={false}
							style={styles.loadingButtonText}
						>
							{fetchingMessages[this.language]}
						</RX.Text>
						<RX.View style={styles.spinner}>
							<Spinner
								size={'small'}
								color={BUTTON_LONG_TEXT}
								isVisible={true}
							/>
						</RX.View>
					</RX.View>
				</RX.View>
			);
		}

		const floatingSendButton = (
			<FloatingSendButton
				onPressSendButton={this.props.onPressSendButton}
				offline={this.state.offline}
			/>
		);

		return (
			<RX.View
				style={styles.container}
				onPress={() => RX.UserInterface.dismissKeyboard()}
			>
				<VirtualListView
					onScroll={this.onScroll}
					ref={component => (this.virtualListView = component!)}
					itemList={this.state.eventListItems}
					renderItem={this.renderItem}
					skipRenderIfItemUnchanged={true}
					animateChanges={true}
					onLayout={this.onLayout}
					keyboardShouldPersistTaps={true}
				/>
				{arrowButton}
				{moreButton}
				{loadingButton}
				{floatingSendButton}
			</RX.View>
		);
	}
}
