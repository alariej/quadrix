import React, { ReactElement } from 'react';
import RX from 'reactxp';
import {
	EMOJI_TEXT,
	INPUT_TEXT,
	BORDER_RADIUS,
	SPACING,
	FONT_LARGE,
	BUTTON_COMPOSER_WIDTH,
	DIALOG_WIDTH,
	MODAL_CONTENT_BACKGROUND,
	FONT_EMOJI_LARGE,
	BUTTON_HEIGHT,
	OBJECT_MARGIN,
	TILE_BACKGROUND,
	PLACEHOLDER_TEXT,
	BORDER_RADIUS_CHAT,
	BUTTON_FILL_HEADER,
	LOGO_FILL,
} from '../ui';
import FileHandler from '../modules/FileHandler';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import { StyleRuleSet, TextStyle } from 'reactxp/dist/common/Types';
import {
	messageCouldNotBeSent,
	cancel,
	sending,
	fileCouldNotUpload,
	pressSend,
	pressLoad,
	Languages,
	writeMessage,
} from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import EmojiPicker from './EmojiPicker';
import StringUtils from '../utils/StringUtils';
import { FileInfo_, ImageInfo_, MessageEventContent_, RoomType, ThumbnailInfo_, VideoInfo_ } from '../models/MatrixApi';
import { FileObject } from '../models/FileObject';
import AppFont from '../modules/AppFont';
import VideoPlayer from '../modules/VideoPlayer';
import ProgressDialog from '../modules/ProgressDialog';
import { UploadFileInfo } from '../models/UploadFileInfo';
import ReplyMessage from './ReplyMessage';
import AsyncStorage from '../modules/AsyncStorage';
import DialogMenuComposer from '../dialogs/DialogMenuComposer';
import AnimatedButton from './AnimatedButton';
import { FilteredChatEvent, TemporaryMessage } from '../models/FilteredChatEvent';
import Sound from '../modules/Sound';

const styles = {
	container: RX.Styles.createViewStyle({
		flexDirection: 'row',
		paddingTop: SPACING,
		paddingBottom: SPACING,
		backgroundColor: LOGO_FILL,
	}),
	textInputContainer: RX.Styles.createViewStyle({
		flex: 1,
		borderRadius: BORDER_RADIUS_CHAT,
		marginLeft: SPACING / 2,
		marginRight: SPACING / 2,
		backgroundColor: TILE_BACKGROUND,
	}),
	textInput: RX.Styles.createTextStyle({
		flex: 1,
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		borderRadius: BORDER_RADIUS_CHAT,
		backgroundColor: TILE_BACKGROUND,
		lineHeight: FONT_LARGE + 4,
		paddingHorizontal: SPACING,
		textAlignVertical: 'center',
		minHeight: BUTTON_COMPOSER_WIDTH,
	}),
	button: RX.Styles.createViewStyle({
		borderRadius: BUTTON_COMPOSER_WIDTH / 2,
		width: BUTTON_COMPOSER_WIDTH,
		height: BUTTON_COMPOSER_WIDTH,
		marginHorizontal: SPACING / 2,
		justifyContent: 'center',
		alignItems: 'center',
	}),
	buttonSend: RX.Styles.createViewStyle({
		borderRadius: BUTTON_COMPOSER_WIDTH / 2,
		width: BUTTON_COMPOSER_WIDTH,
		height: BUTTON_COMPOSER_WIDTH,
		marginHorizontal: SPACING / 2,
		justifyContent: 'center',
		alignItems: 'center',
	}),
	textDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		color: INPUT_TEXT,
		fontSize: FONT_LARGE,
		margin: 12,
	}),
	fileName: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontWeight: 'bold',
		fontSize: FONT_LARGE,
		wordBreak: 'break-all',
	}),
	emojiPicker: RX.Styles.createViewStyle({
		borderRadius: BORDER_RADIUS,
		backgroundColor: TILE_BACKGROUND,
		marginTop: SPACING,
		height: 7 * (FONT_EMOJI_LARGE + 2 * SPACING) + 2 * SPACING,
		width: 260,
		padding: SPACING,
		shadowOffset: { width: -1, height: 1 },
		shadowColor: 'silver',
		shadowRadius: 7,
		elevation: 3,
		shadowOpacity: 1,
		overflow: 'visible',
	}),
	emoji: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		color: EMOJI_TEXT,
		fontSize: FONT_EMOJI_LARGE,
	}),
	emojiButton: RX.Styles.createButtonStyle({
		flex: 1,
	}),
	containerContent: RX.Styles.createViewStyle({
		width: DIALOG_WIDTH,
		padding: SPACING,
		backgroundColor: MODAL_CONTENT_BACKGROUND,
		borderRadius: BORDER_RADIUS,
	}),
	containerVideo: RX.Styles.createViewStyle({
		flex: 1,
		overflow: 'hidden',
		borderRadius: BORDER_RADIUS - 2,
	}),
	image: RX.Styles.createImageStyle({
		flex: 1,
		borderRadius: BORDER_RADIUS - 2,
	}),
};

type EmojiFile = string[];

interface ComposerProps extends RX.CommonProps {
	roomId: string;
	roomType: RoomType;
	showTempSentMessage: (message: TemporaryMessage) => void;
	replyMessage: FilteredChatEvent;
	showVideoCall: (roomId: string) => void;
	roomActive: boolean;
	floatingSendButton: (onPressSendButton: (() => void) | undefined) => void;
}

interface ComposerState {
	textInput: string | undefined;
	offline: boolean;
	sendDisabled: boolean;
	showProgress: boolean;
	progressValue: number;
	showReplyMessage: boolean;
}

export default class Composer extends ComponentBase<ComposerProps, ComposerState> {
	/*

    NOTES

    - Cannot use the setValue method on textInput (multiline), as it seems to be ignored by
      the automatic height adjustment mechanism of that component. Assigning a state variable
      to the value prop works. But this leads to issues since the value prop fixes the content
      of textInput, as long as it is not undefined. Typing into a textInput with a fixed value
      is ignored. It means the state variable must be reset to undefined as soon as the user
      starts typing. This is done in the onKeyPress prop of textInput.
    - TODO: file a bug report on github

    */

	private textInputComponent: RX.TextInput | undefined;
	private buttonComponent: RX.Button | undefined;
	private textInput = '';
	private textInputStyle: StyleRuleSet<TextStyle>;
	private language: Languages = 'en';
	private isAndroid: boolean;
	private isWeb: boolean;
	private selection: { start: number; end: number } | undefined;
	private emojiPicker: ReactElement | undefined;
	private videoHeight: number | undefined;
	private videoWidth: number | undefined;
	private progressText = '';
	private replyEvent: FilteredChatEvent | undefined;
	private containerView: RX.View | undefined;
	private isNativeMobile: boolean;
	private isNarrow: boolean;

	constructor(props: ComposerProps) {
		super(props);

		this.language = UiStore.getLanguage();

		const platform = UiStore.getPlatform();
		this.isWeb = platform === 'web';
		this.isAndroid = platform === 'android';
		this.isNativeMobile = ['android', 'ios'].includes(platform);
		this.isNarrow = UiStore.getAppLayout_().type === 'narrow';

		const numLines = 10;
		const paddingVertical = this.isAndroid ? 2 : (BUTTON_COMPOSER_WIDTH - (FONT_LARGE + 4)) / 2;
		const maxHeightPadding = this.isAndroid ? -1 * (numLines + 1) : paddingVertical * 2;
		this.textInputStyle = RX.Styles.createTextStyle(
			{
				paddingTop: paddingVertical,
				paddingBottom: paddingVertical,
				maxHeight: numLines * (FONT_LARGE + 4) + maxHeightPadding,
			},
			false
		);
	}

	protected _buildState(
		nextProps: ComposerProps,
		initState: boolean,
		_prevState: ComposerState
	): Partial<ComposerState> {
		const partialState: Partial<ComposerState> = {};

		if (initState) {
			partialState.sendDisabled = false;
			partialState.showProgress = false;
			partialState.showReplyMessage = false;
			this.getTextInputFromStorage(nextProps.roomId);
		} else if (this.props.roomId !== nextProps.roomId) {
			this.setTextInputToStorage(this.props.roomId);
			this.getTextInputFromStorage(nextProps.roomId);
			partialState.showReplyMessage = false;
		} else if (
			nextProps.replyMessage &&
			(!this.props.replyMessage || nextProps.replyMessage !== this.props.replyMessage)
		) {
			this.replyEvent = nextProps.replyMessage;
			partialState.showReplyMessage = true;
		}

		partialState.offline = UiStore.getOffline();

		return partialState;
	}

	public componentDidMount(): void {
		super.componentDidMount();

		this.emojiPicker = (
			<RX.View style={styles.emojiPicker}>
				<EmojiPicker emojiArray={this.getEmojiArray()} />
			</RX.View>
		);

		if (this.state.showReplyMessage) {
			this.textInputComponent?.focus();
		}
	}

	public componentWillUnmount(): void {
		super.componentWillUnmount();

		this.setTextInputToStorage(this.props.roomId);

		RX.Popup.dismissAll();
	}

	private getEmojiArray = (): ReactElement[] => {
		const emojiJson = require('../resources/emoji/data-ordered-emoji.json') as EmojiFile;

		return emojiJson.map((emoji, i: number) => {
			return (
				<RX.Button
					key={i}
					style={styles.emojiButton}
					onPress={event => this.addEmoji(event, emoji)}
					disableTouchOpacityAnimation={true}
				>
					<RX.Text
						allowFontScaling={false}
						style={styles.emoji}
					>
						{emoji}
					</RX.Text>
				</RX.Button>
			);
		});
	};

	private getTextInputFromStorage = (roomId: string) => {
		AsyncStorage.getItem('composer' + roomId)
			.then(textInput => {
				this.textInput = textInput || '';
				this.setState({ textInput: this.textInput });
				if (this.isNativeMobile && this.textInput) {
					this.props.floatingSendButton(this.onPressSendButton);
				}
			})
			.catch(_error => null);
	};

	private setTextInputToStorage = (roomId: string) => {
		if (this.textInput) {
			AsyncStorage.setItem('composer' + roomId, this.textInput).catch(_error => null);
		} else {
			AsyncStorage.removeItem('composer' + roomId).catch(_error => null);
		}
	};

	private onPressSendButton = async () => {
		Sound.play('plop');

		if (!this.textInput) {
			return;
		}

		if (this.isWeb) {
			RX.Popup.dismiss('emojiPicker');
		}

		const textInput = this.textInput;
		this.textInput = '';
		this.setState({
			textInput: '',
			sendDisabled: true,
		});

		if (this.isNativeMobile) {
			this.props.floatingSendButton(undefined);
		}

		setTimeout(() => {
			if (this.state.sendDisabled) {
				this.setState({ sendDisabled: false });
			}
		}, 5000);

		const tempId = 'text' + Date.now();

		this.props.showTempSentMessage({ body: textInput, tempId: tempId });

		const showError = () => {
			this.props.showTempSentMessage({ body: '', tempId: tempId });

			this.textInput = textInput;
			this.setState({
				textInput: textInput,
				sendDisabled: false,
			});

			const text = <RX.Text style={styles.textDialog}>{messageCouldNotBeSent[this.language]}</RX.Text>;

			RX.Modal.show(<DialogContainer content={text} />, 'errordialog');
		};

		let messageContent: MessageEventContent_ = {
			msgtype: 'm.text',
		};

		const linkifyElement = StringUtils.getOnlyUrl(textInput);
		if (linkifyElement) {
			const previewData = await StringUtils.getLinkPreview(linkifyElement).catch();

			if (previewData) {
				messageContent._url_preview = previewData;
			}
		}

		if (this.state.showReplyMessage) {
			const strippedReplyMessage = StringUtils.stripReplyMessage(
				(this.replyEvent!.content as MessageEventContent_).body || ''
			);

			const codeReplyMessage = (body: string): string => {
				return body.replace(/^(.*)$/gm, '> $&');
			};
			const codedReplyMessage = codeReplyMessage(strippedReplyMessage);

			const fallback = codedReplyMessage.replace('> ', '> <' + this.replyEvent!.senderId + '> ') + '\n\n';

			messageContent = {
				...messageContent,
				body: fallback + textInput,
				'm.relates_to': {
					'm.in_reply_to': {
						event_id: this.replyEvent!.eventId,
					},
				},
			};
		} else {
			messageContent.body = textInput;
		}

		setTimeout(() => {
			ApiClient.sendMessage(this.props.roomId, messageContent, tempId)
				.then(_response => {
					this.setState({
						sendDisabled: false,
						showReplyMessage: false,
					});
				})
				.catch(_error => {
					this.setState({
						sendDisabled: false,
						showReplyMessage: false,
					});
					showError();
				});
		}, 250);
	};

	private onPressFile = async () => {
		const file = await FileHandler.pickFile(false);

		if (file) {
			this.sendFile(file).catch(_error => null);
		}
	};

	private onPressImage = async () => {
		const file = await FileHandler.pickImage();

		if (file) {
			this.sendFile(file).catch(_error => null);
		}
	};

	private sendFile = async (file: FileObject) => {
		const shouldUpload = await this.showFileDialog(file);

		if (!shouldUpload) {
			RX.Modal.dismiss('filesendingdialog');
			return;
		}

		RX.Modal.dismiss('filesendingdialog');

		const tempId = 'media' + Date.now();

		this.props.showTempSentMessage({ body: '[' + sending[this.language] + file.name + ']', tempId: tempId });

		this.setState({ showProgress: true });

		const fetchProgress = (_text: string, _progress: number) => {
			this.progressText = _text;
			this.setState({ progressValue: _progress });
		};

		FileHandler.uploadFile(ApiClient.credentials, file, fetchProgress)
			.then((response: UploadFileInfo) => {
				this.setState({
					showProgress: false,
					showReplyMessage: false,
					progressValue: 0,
				});
				this.progressText = '';

				if (response.uri) {
					const messageType = StringUtils.messageMediaType(file.type);

					let thumbnailInfo: ThumbnailInfo_ | undefined;
					if (response.thumbnailInfo) {
						thumbnailInfo = {
							mimetype: response.thumbnailInfo.mimeType,
							size: response.thumbnailInfo.fileSize,
							h: response.thumbnailInfo.height,
							w: response.thumbnailInfo.width,
						};
					}

					let contentInfo;

					switch (messageType) {
						case 'm.image':
							contentInfo = {
								mimetype: response.mimeType || file.type,
								size: response.fileSize || file.size!,
								h: file.imageHeight,
								w: file.imageWidth,
								thumbnail_url: response.thumbnailUrl || undefined,
								thumbnail_info: thumbnailInfo || undefined,
							} as ImageInfo_;
							break;

						case 'm.video':
							contentInfo = {
								mimetype: response.mimeType || file.type,
								duration: undefined,
								size: response.fileSize || file.size!,
								h: this.videoHeight,
								w: this.videoWidth,
								thumbnail_url: response.thumbnailUrl || undefined,
								thumbnail_info: thumbnailInfo || undefined,
							} as VideoInfo_;
							break;

						default:
							contentInfo = {
								mimetype: response.mimeType || file.type,
								size: response.fileSize || file.size!,
								thumbnail_url: response.thumbnailUrl || undefined,
								thumbnail_info: thumbnailInfo || undefined,
							} as FileInfo_;
							break;
					}

					const messageContent: MessageEventContent_ = {
						msgtype: messageType,
						body: response.fileName || file.name,
						info: contentInfo,
						url: response.uri,
					};

					ApiClient.sendMessage(this.props.roomId, messageContent, tempId).catch(_error => {
						this.props.showTempSentMessage({ body: '', tempId: tempId });

						const text = (
							<RX.Text style={styles.textDialog}>{messageCouldNotBeSent[this.language]}</RX.Text>
						);

						RX.Modal.show(<DialogContainer content={text} />, 'errordialog');
					});
				} else {
					throw new Error('');
				}
			})
			.catch(_error => {
				this.setState({
					showProgress: false,
					showReplyMessage: false,
					progressValue: 0,
				});
				this.progressText = '';

				this.props.showTempSentMessage({ body: '', tempId: tempId });

				const text = <RX.Text style={styles.textDialog}>{fileCouldNotUpload[this.language]}</RX.Text>;

				RX.Modal.show(
					<DialogContainer
						content={text}
						modalId={'errordialog'}
					/>,
					'errordialog'
				);
			});
	};

	private showFileDialog = (file: FileObject): Promise<boolean> => {
		RX.Modal.dismissAll();
		this.textInputComponent?.blur();

		return new Promise(resolve => {
			let content: ReactElement;

			if (file.type.startsWith('image') && !(file.type.includes('svg') && UiStore.getPlatform() !== 'web')) {
				const heightStyle = RX.Styles.createViewStyle(
					{
						height: ((DIALOG_WIDTH - 2 * SPACING) * file.imageHeight!) / file.imageWidth!,
						maxHeight: UiStore.getAppLayout_().screenHeight - BUTTON_HEIGHT - 2 * OBJECT_MARGIN,
					},
					false
				);

				content = (
					<RX.View style={styles.containerContent}>
						<RX.Image
							resizeMode={'contain'}
							style={[styles.image, heightStyle]}
							source={file.uri}
						/>
					</RX.View>
				);
			} else if (file.type.startsWith('video')) {
				const setDimensions = (videoHeight: number, videoWidth: number) => {
					this.videoHeight = videoHeight;
					this.videoWidth = videoWidth;
				};

				content = (
					<RX.View style={styles.containerContent}>
						<RX.View style={styles.containerVideo}>
							<VideoPlayer
								uri={file.uri}
								mimeType={file.type || 'video/mp4'}
								autoplay={false}
								setDimensions={setDimensions}
							/>
						</RX.View>
					</RX.View>
				);
			} else {
				content = (
					<RX.Text style={styles.textDialog}>
						<RX.Text style={styles.fileName}>{file.name}</RX.Text>
					</RX.Text>
				);
			}

			const dialog = (
				<DialogContainer
					content={content}
					confirmButton={true}
					confirmButtonText={
						this.props.roomType === 'notepad' ? pressLoad[this.language] : pressSend[this.language]
					}
					cancelButton={true}
					cancelButtonText={cancel[this.language]}
					onConfirm={() => resolve(true)}
					onCancel={() => resolve(false)}
				/>
			);

			RX.Modal.show(dialog, 'filesendingdialog');
		});
	};

	private onChangeText = (textInput: string) => {
		if (this.isNativeMobile) {
			if (textInput && !this.textInput) {
				this.props.floatingSendButton(this.onPressSendButton);
			} else if (!textInput && this.textInput) {
				this.props.floatingSendButton(undefined);
			}
		}
		this.textInput = textInput;
	};

	private onKeyPress = (event: RX.Types.KeyboardEvent) => {
		if (this.state.textInput !== undefined) {
			this.setState({ textInput: undefined });
		}

		if (this.state.sendDisabled) {
			return;
		}

		if (event.shiftKey && event.key === 'Enter') {
			event.preventDefault();

			this.onPressSendButton().catch(_error => null);
		}
	};

	private onPressVideoCall = (): void => {
		this.textInputComponent?.blur();

		this.props.showVideoCall(this.props.roomId);
	};

	private onSelectionChange = (start: number, end: number) => {
		this.selection = { start: start, end: end };
	};

	private addEmoji = (_event: RX.Types.SyntheticEvent, emoji: string) => {
		if (!this.selection) {
			this.selection = { start: this.textInput.length, end: this.textInput.length };
		}

		this.textInput =
			this.textInput.substr(0, this.selection?.start) + emoji + this.textInput.substr(this.selection?.end || 0);
		this.selection = { start: this.selection.start + emoji.length, end: this.selection.start + emoji.length };

		this.setState({ textInput: this.textInput }, () => {
			if (this.isWeb || this.isAndroid) {
				this.textInputComponent!.focus();
				this.textInputComponent?.selectRange(this.selection!.start, this.selection!.end);
			}
		});
	};

	private toggleEmojiPicker = () => {
		if (!this.emojiPicker) {
			return;
		}

		this.textInputComponent?.requestFocus();

		const popupOptions: RX.Types.PopupOptions = {
			getAnchor: () => {
				return this.textInputComponent!;
			},
			getElementTriggeringPopup: () => {
				return this.buttonComponent!;
			},
			renderPopup: (
				_anchorPosition: RX.Types.PopupPosition,
				_anchorOffset: number,
				_popupWidth: number,
				_popupHeight: number
			) => {
				return this.emojiPicker;
			},
			preventDismissOnPress: false,
			dismissIfShown: true,
			onDismiss: () => {
				if (this.isAndroid) {
					this.textInputComponent?.blur();
					this.textInputComponent?.focus();
				}
			},
		};

		RX.Popup.show(popupOptions, 'emojiPicker', 0);
	};

	private onCancelReply = () => {
		this.setState({ showReplyMessage: false });
	};

	private showMenu = () => {
		RX.UserInterface.measureLayoutRelativeToWindow(this.containerView!)
			.then(layout => {
				const dialogMenuComposer = (
					<DialogMenuComposer
						layout={layout}
						roomId={this.props.roomId}
						roomType={this.props.roomType}
						roomActive={this.props.roomActive}
						onPressFile={this.onPressFile}
						onPressImage={this.onPressImage}
						onPressVideoCall={this.onPressVideoCall}
					/>
				);

				RX.Modal.show(dialogMenuComposer, 'dialog_menu_composer');
			})
			.catch(_error => null);
	};

	public render(): ReactElement | null {
		let progressDialog: ReactElement | undefined;
		if (this.state.showProgress) {
			progressDialog = (
				<ProgressDialog
					text={this.progressText}
					value={this.state.progressValue}
				/>
			);
		}

		let replyMessage: ReactElement | undefined;
		if (this.state.showReplyMessage) {
			replyMessage = (
				<ReplyMessage
					replyEvent={this.replyEvent!}
					roomId={this.props.roomId}
					onCancelButton={this.onCancelReply}
				/>
			);
		}

		return (
			<RX.View
				style={[
					styles.container,
					{
						borderBottomLeftRadius: this.isNarrow ? undefined : 6,
					},
				]}
				ref={component => (this.containerView = component!)}
				onLayout={() => null}
			>
				<AnimatedButton
					buttonStyle={styles.button}
					iconSource={require('../resources/svg/RI_menu.json') as SvgFile}
					iconStyle={{ opacity: this.state.offline || !this.props.roomActive ? 0.3 : 1 }}
					iconFillColor={BUTTON_FILL_HEADER}
					iconHeight={18}
					iconWidth={18}
					animatedColor={BUTTON_FILL_HEADER}
					onPress={this.showMenu}
					disabled={this.state.offline || !this.props.roomActive}
				/>
				<RX.Button
					style={styles.button}
					ref={component => (this.buttonComponent = component!)}
					onPressIn={this.toggleEmojiPicker}
					disableTouchOpacityAnimation={false}
					underlayColor={BUTTON_FILL_HEADER}
					activeOpacity={0.7}
					disabled={!this.props.roomActive}
					disabledOpacity={0.3}
				>
					<IconSvg
						source={require('../resources/svg/RI_smiley.json') as SvgFile}
						fillColor={BUTTON_FILL_HEADER}
						height={20}
						width={20}
					/>
				</RX.Button>
				<RX.View style={styles.textInputContainer}>
					{replyMessage}

					<RX.TextInput
						style={[styles.textInput, this.textInputStyle]}
						ref={component => (this.textInputComponent = component!)}
						onKeyPress={this.onKeyPress}
						onChangeText={this.onChangeText}
						value={this.state.textInput}
						editable={this.props.roomActive || false}
						keyboardType={'default'}
						disableFullscreenUI={true}
						allowFontScaling={false}
						autoCapitalize={'sentences'}
						autoCorrect={this.isWeb ? undefined : true}
						autoFocus={false}
						spellCheck={this.isWeb ? undefined : true}
						multiline={true}
						onSelectionChange={this.onSelectionChange}
						placeholder={writeMessage[this.language]}
						placeholderTextColor={PLACEHOLDER_TEXT}
					/>
				</RX.View>
				<AnimatedButton
					buttonStyle={styles.buttonSend}
					iconSource={require('../resources/svg/RI_send.json') as SvgFile}
					iconStyle={{
						opacity: this.state.offline || !this.props.roomActive || this.state.sendDisabled ? 0.3 : 1,
					}}
					iconFillColor={BUTTON_FILL_HEADER}
					iconHeight={20}
					iconWidth={20}
					animatedColor={BUTTON_FILL_HEADER}
					onPress={this.onPressSendButton}
					disabled={this.state.offline || !this.props.roomActive || this.state.sendDisabled}
				/>
				{progressDialog}
			</RX.View>
		);
	}
}
