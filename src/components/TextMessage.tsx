import React, { ReactElement } from 'react';
import RX from 'reactxp';
import {
	TILE_MESSAGE_TEXT,
	LINK_TEXT,
	FONT_LARGE,
	BUTTON_ROUND_WIDTH,
	SPACING,
	PAGE_MARGIN,
	FONT_EMOJI_LARGE,
	FONT_NORMAL,
	TILE_SYSTEM_TEXT,
	BORDER_RADIUS_CHAT,
} from '../ui';
import UiStore from '../stores/UiStore';
import * as linkify from 'linkifyjs';
import { edited } from '../translations';
import { LinkifyElement } from '../models/LinkifyElement';
import AppFont from '../modules/AppFont';
import StringUtils from '../utils/StringUtils';
import { FilteredChatEvent } from '../models/FilteredChatEvent';
import { LinkPreview_, MessageEventContent_ } from '../models/MatrixApi';

const styles = {
	containerMessage: RX.Styles.createViewStyle({
		flexDirection: 'column',
		overflow: 'visible',
	}),
	containerText: RX.Styles.createTextStyle({
		flex: 1,
		fontFamily: AppFont.fontFamily,
		paddingRight: SPACING,
		overflow: 'visible',
		wordBreak: 'break-word',
	}),
	text: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		color: TILE_MESSAGE_TEXT,
		lineHeight: FONT_LARGE + 4,
		overflow: 'visible',
	}),
	allEmojis: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_EMOJI_LARGE,
		color: TILE_MESSAGE_TEXT,
		lineHeight: FONT_EMOJI_LARGE + 4,
		overflow: 'visible',
	}),
	handle: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		color: TILE_MESSAGE_TEXT,
		fontStyle: 'italic',
		wordBreak: 'break-all',
	}),
	link: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		color: LINK_TEXT,
		textDecorationLine: 'underline',
		wordBreak: 'break-all',
		cursor: 'pointer',
	}),
	edited: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: TILE_SYSTEM_TEXT,
	}),
	image: RX.Styles.createImageStyle({
		flex: 1,
		borderRadius: BORDER_RADIUS_CHAT - SPACING,
	}),
	containerImage: RX.Styles.createViewStyle({
		flex: 1,
		cursor: 'pointer',
	}),
};

interface TextMessageProps {
	roomId: string;
	message: FilteredChatEvent;
	body: string;
	showContextDialog: () => void;
}

interface TextMessageState {
	previewUrl: string | undefined;
}

export default class TextMessage extends RX.Component<TextMessageProps, TextMessageState> {
	private onPreviewImageFail = (_error: Error) => {
		// bubblegum & wires hack
		// for backward compatibility
		const content = this.props.message.content as MessageEventContent_;
		// @ts-ignore
		const urlPreview = content._url_preview || (content.url_preview as LinkPreview_); // TODO: remove

		const linkifyElement: LinkifyElement = {
			type: '',
			href: urlPreview.url,
			value: '',
		};

		StringUtils.getLinkPreview(linkifyElement)
			.then(response => {
				this.setState({ previewUrl: response?.image_url });
			})
			.catch(_error => null);
	};

	private launchLinkApp = (event: RX.Types.SyntheticEvent, linkifyElement: LinkifyElement) => {
		event.stopPropagation();

		if (linkifyElement.type === 'url') {
			if (UiStore.getIsElectron()) {
				const { shell } = window.require('electron');
				shell.openExternal(linkifyElement.href).catch(_error => null);
			} else {
				RX.Linking.openUrl(linkifyElement.href).catch(_error => null);
			}
		} else if (linkifyElement.type === 'email') {
			RX.Linking.launchEmail({ to: [linkifyElement.value] }).catch(_error => null);
		}
	};

	public render(): JSX.Element | null {
		if (!this.props.body) {
			return null;
		}

		const isSelectable = UiStore.getPlatform() === 'web' && UiStore.getDevice() === 'desktop';

		const messageRenderArray: Array<ReactElement> = [];

		if (this.props.message.isEdited) {
			const language = UiStore.getLanguage();
			const editedInfo = (
				<RX.Text
					key={'edited'}
					style={styles.edited}
				>
					{edited[language] + ' '}
				</RX.Text>
			);
			messageRenderArray.push(editedInfo);
		}

		let renderContent: ReactElement;

		let messageBody: string;
		const content = this.props.message.content as MessageEventContent_;
		const replyEventId = content['m.relates_to']?.['m.in_reply_to']?.event_id;
		if (replyEventId) {
			messageBody = StringUtils.stripReplyMessage(this.props.body);
		} else {
			messageBody = this.props.body;
		}

		// bubblegum & wires hack
		// for backward compatibility
		// @ts-ignore
		const urlPreview = content._url_preview || (content.url_preview as LinkPreview_); // TODO: remove

		if (urlPreview) {
			const linkifyElement: LinkifyElement = {
				type: 'url',
				value: urlPreview.text!,
				href: urlPreview.url,
			};

			const width =
				UiStore.getAppLayout_().pageWidth - 2 * PAGE_MARGIN - (BUTTON_ROUND_WIDTH + SPACING) - 2 * SPACING;

			let urlPreviewImage;
			if (urlPreview.image_url) {
				const urlPreviewHeight = (width * urlPreview.image_height!) / (urlPreview.image_width || 100);

				urlPreviewImage = (
					<RX.View
						style={[styles.containerImage, { height: urlPreviewHeight, width: width }]}
						onPress={event => this.launchLinkApp(event, linkifyElement)}
						onContextMenu={() => this.props.showContextDialog()}
						onLongPress={() => this.props.showContextDialog()}
						disableTouchOpacityAnimation={true}
					>
						<RX.Image
							resizeMode={'contain'}
							style={styles.image}
							source={this.state?.previewUrl || urlPreview?.image_url}
							headers={UiStore.getPlatform() === 'ios' ? { 'Cache-Control': 'max-stale' } : undefined}
							onError={this.onPreviewImageFail}
						/>
					</RX.View>
				);
			}

			const urlPreviewView = (
				<RX.View
					onContextMenu={() => this.props.showContextDialog()}
					onLongPress={() => this.props.showContextDialog()}
					disableTouchOpacityAnimation={true}
				>
					{urlPreviewImage}
					<RX.Text
						style={[
							styles.text,
							{
								marginTop: SPACING,
								paddingLeft: urlPreview.image_url ? 0 : SPACING,
								paddingRight: urlPreview.image_url ? 0 : SPACING,
							},
						]}
						selectable={isSelectable}
					>
						{urlPreview.title}
					</RX.Text>
					<RX.Text
						style={[
							styles.link,
							{
								marginTop: SPACING * 2,
								paddingLeft: urlPreview.image_url ? 0 : SPACING,
								paddingRight: urlPreview.image_url ? 0 : SPACING,
								maxWidth: width,
							},
						]}
						onPress={event => this.launchLinkApp(event, linkifyElement)}
						onContextMenu={() => this.props.showContextDialog()}
						numberOfLines={UiStore.getPlatform() === 'web' ? 1 : 2}
					>
						{urlPreview.text}
					</RX.Text>
				</RX.View>
			);

			renderContent = urlPreviewView;
		} else if (StringUtils.isAllEmojis(messageBody)) {
			renderContent = (
				<RX.Text style={styles.containerText}>
					<RX.Text
						style={styles.allEmojis}
						selectable={isSelectable}
					>
						{messageBody}
					</RX.Text>
				</RX.Text>
			);
		} else {
			let linkifyArray: LinkifyElement[] = [];
			let textArray: string[] = [];

			linkifyArray = linkify.find(messageBody);

			if (linkifyArray.length > 0) {
				let bodyText = messageBody;

				linkifyArray.map((linkifyElement, i) => {
					textArray = bodyText.split(linkifyElement.value, 1);

					// check if we have a matrix handle in the last word before a link
					const lastWord = textArray[0].split(/\s/).slice(-1)[0];

					if (lastWord.match(/[#@].*[:]$/gi)) {
						const pos = textArray[0].lastIndexOf(lastWord);
						const firstPart = textArray[0].substring(0, pos);

						if (firstPart) {
							const text = (
								<RX.Text
									key={'text_' + i}
									style={styles.text}
									selectable={isSelectable}
								>
									{firstPart}
								</RX.Text>
							);
							messageRenderArray.push(text);
						}

						const text = (
							<RX.Text
								key={'handle_' + i}
								style={styles.handle}
								selectable={isSelectable}
							>
								{lastWord + linkifyElement.value}
							</RX.Text>
						);
						messageRenderArray.push(text);
					} else {
						if (textArray[0]) {
							const text = (
								<RX.Text
									key={'text_' + i}
									style={styles.text}
									selectable={isSelectable}
								>
									{textArray[0]}
								</RX.Text>
							);
							messageRenderArray.push(text);
						}

						const link = (
							<RX.Text
								key={'link_' + i}
								style={styles.link}
								onPress={event => this.launchLinkApp(event, linkifyElement)}
								selectable={isSelectable}
							>
								{linkifyElement.value}
							</RX.Text>
						);
						messageRenderArray.push(link);
					}

					bodyText = bodyText.replace(textArray[0] + linkifyElement.value, '');
				});

				if (bodyText) {
					const text = (
						<RX.Text
							key={'text_last'}
							style={styles.text}
							selectable={isSelectable}
						>
							{bodyText}
						</RX.Text>
					);
					messageRenderArray.push(text);
				}
			} else {
				const text = (
					<RX.Text
						key={'text'}
						style={styles.text}
						selectable={isSelectable}
					>
						{messageBody}
					</RX.Text>
				);
				messageRenderArray.push(text);
			}

			renderContent = <RX.Text style={styles.containerText}>{messageRenderArray}</RX.Text>;
		}

		return <RX.GestureView style={styles.containerMessage}>{renderContent}</RX.GestureView>;
	}
}
