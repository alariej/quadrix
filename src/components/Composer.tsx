import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { APP_ID } from '../appconfig';
import { EMOJI_TEXT, INPUT_TEXT, BORDER_RADIUS, SPACING, FONT_LARGE, BUTTON_ROUND_WIDTH, BUTTON_FILL,
    BUTTON_COMPOSER_WIDTH, OPAQUE_BACKGROUND, COMPOSER_BORDER, DIALOG_WIDTH, MODAL_CONTENT_BACKGROUND, FONT_EMOJI_LARGE,
    BUTTON_HEIGHT, OBJECT_MARGIN, TILE_BACKGROUND } from '../ui';
import FileHandler from '../modules/FileHandler';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import { StyleRuleSet, TextStyle } from 'reactxp/dist/common/Types';
import { messageCouldNotBeSent, cancel, sending, clickHereOrPressShftEnter, pressOKJitsi, jitsiStartedExternal,
    jitsiStartedInternal, fileCouldNotUpload, pressSend, pressLoad, Languages } from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import EmojiPicker from './EmojiPicker';
import StringUtils from '../utils/StringUtils';
import { MessageEventContentInfo_, MessageEventContent_, RoomType, ThumbnailInfo_ } from '../models/MatrixApi';
import { FileObject } from '../models/FileObject';
import { MessageEvent, TemporaryMessage } from '../models/MessageEvent';
import AppFont from '../modules/AppFont';
import VideoPlayer from '../modules/VideoPlayer';
import ProgressDialog from '../modules/ProgressDialog';
import { UploadFileInfo } from '../models/UploadFileInfo';
import ReplyMessage from './ReplyMessage';

const styles = {
    container: RX.Styles.createViewStyle({
        flexDirection: 'row',
        marginBottom: SPACING,
        paddingBottom: SPACING,
        borderBottomWidth: 1,
        borderColor: COMPOSER_BORDER,
    }),
    textInputContainer: RX.Styles.createViewStyle({
        flex: 1,
        borderRadius: BORDER_RADIUS,
        marginLeft: SPACING / 2,
        marginRight: SPACING / 2,
        backgroundColor: TILE_BACKGROUND,
    }),
    textInput: RX.Styles.createTextStyle({
        flex: 1,
        fontFamily: AppFont.fontFamily,
        fontSize: FONT_LARGE,
        borderRadius: BORDER_RADIUS,
        backgroundColor: TILE_BACKGROUND,
        lineHeight: FONT_LARGE + 4,
        paddingHorizontal: SPACING,
        textAlignVertical: 'center',
        minHeight: BUTTON_COMPOSER_WIDTH,
    }),
    button: RX.Styles.createViewStyle({
        width: BUTTON_COMPOSER_WIDTH,
        height: BUTTON_COMPOSER_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    buttonSend: RX.Styles.createViewStyle({
        width: BUTTON_ROUND_WIDTH + SPACING / 2,
        height: BUTTON_COMPOSER_WIDTH,
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
        shadowOffset: { width: -2, height: 2 },
        shadowColor: OPAQUE_BACKGROUND,
        shadowRadius: BORDER_RADIUS,
        elevation: 3,
        shadowOpacity: 1,
        overflow: 'visible',
        marginTop: SPACING,
        height: 7 * (FONT_EMOJI_LARGE + 2 * SPACING) + 2 * SPACING,
        width: 260,
        padding: SPACING,
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
    replyMessage: MessageEvent;
    showJitsiMeet: (id: string) => void;
    roomActive: boolean;
}

interface ComposerState {
    textInput: string | undefined;
    offline: boolean;
    jitsiActive: boolean;
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
    private selection: { start: number, end: number } | undefined;
    private emojiPicker: ReactElement | undefined;
    private videoHeight: number | undefined;
    private videoWidth: number | undefined;
    private progressText = '';
    private replyEvent: MessageEvent | undefined;

    constructor(props: ComposerProps) {
        super(props);

        this.language = UiStore.getLanguage();

        const platform = UiStore.getPlatform();
        this.isWeb = platform === 'web';
        this.isAndroid = platform === 'android';

        const numLines = 10;
        const paddingVertical = this.isAndroid ? 2 : (BUTTON_COMPOSER_WIDTH - (FONT_LARGE + 4)) / 2;
        const maxHeightPadding = this.isAndroid ? -1 * (numLines + 1) : paddingVertical * 2;
        this.textInputStyle = RX.Styles.createTextStyle({
            paddingTop: paddingVertical,
            paddingBottom: paddingVertical,
            maxHeight: (numLines * (FONT_LARGE + 4)) + maxHeightPadding,
        }, false);
    }

    protected _buildState(nextProps: ComposerProps, initState: boolean, _prevState: ComposerState): Partial<ComposerState> {

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

        } else if (nextProps.replyMessage && (!this.props.replyMessage || (nextProps.replyMessage !== this.props.replyMessage))) {

            this.replyEvent = nextProps.replyMessage;
            partialState.showReplyMessage = true;
        }

        partialState.offline = UiStore.getOffline();
        partialState.jitsiActive = UiStore.getJitsiActive();

        return partialState;
    }

    public componentDidMount(): void {
        super.componentDidMount();

        this.emojiPicker = (
            <RX.View style={ styles.emojiPicker }>
                <EmojiPicker emojiArray={ this.getEmojiArray() } />
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
                    key={ i }
                    style={ styles.emojiButton }
                    onPress={ event => this.addEmoji(event, emoji) }
                    disableTouchOpacityAnimation={ true }
                >
                    <RX.Text allowFontScaling={ false } style={ styles.emoji }>
                        { emoji }
                    </RX.Text>
                </RX.Button>
            );
        });
    }

    private getTextInputFromStorage = (roomId: string) => {

        RX.Storage.getItem('composer' + roomId)
            .then((textInput) => {

                this.textInput = textInput || '';
                this.setState({ textInput: this.textInput });
            })
            .catch(_error => null);
    }

    private setTextInputToStorage = (roomId: string) => {

        if (this.textInput) {
            RX.Storage.setItem('composer' + roomId, this.textInput).catch(_error => null);
        } else {
            RX.Storage.removeItem('composer' + roomId).catch(_error => null);
        }
    }

    private onPressSendButton = async () => {

        if (!this.textInput) { return }

        if (this.isWeb) { RX.Popup.dismiss('emojiPicker'); }

        const textInput = this.textInput;
        this.textInput = '';
        this.setState({
            textInput: '',
            sendDisabled: true,
        });

        setTimeout(() => {
            if (this.state.sendDisabled) { this.setState({ sendDisabled: false }); }
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

            const text = (
                <RX.Text style={ styles.textDialog }>
                    { messageCouldNotBeSent[this.language] }
                </RX.Text>
            );

            RX.Modal.show(<DialogContainer content={ text }/>, 'errordialog');
        }

        let messageContent: MessageEventContent_ = {
            msgtype: 'm.text',
        }

        const linkifyElement = StringUtils.getOnlyUrl(textInput);
        if (linkifyElement) {

            const previewData = await StringUtils.getLinkPreview(linkifyElement).catch();

            if (previewData) {
                messageContent.url_preview = previewData;
            }
        }

        if (this.state.showReplyMessage) {

            const strippedReplyMessage = StringUtils.stripReplyMessage(this.replyEvent!.content.body || '');

            const codeReplyMessage = (body: string): string => {
                return body.replace(/^(.*)$/mg, '> $&');
            }
            const codedReplyMessage = codeReplyMessage(strippedReplyMessage);

            const fallback = codedReplyMessage.replace('> ', '> <' + this.replyEvent!.senderId + '> ') + '\n\n';

            messageContent = {
                ...messageContent,
                body: fallback + textInput,
                'm.relates_to': {
                    'm.in_reply_to': {
                        event_id: this.replyEvent!.eventId,
                    }
                }
            }

        } else {
            messageContent.body = textInput;
        }

        setTimeout(() => {

            ApiClient.sendMessage(this.props.roomId, messageContent, tempId)
                .then((_response) => {
                    this.setState({
                        sendDisabled: false,
                        showReplyMessage: false
                    });
                })
                .catch(_error => {
                    this.setState({
                        sendDisabled: false,
                        showReplyMessage: false
                    });
                    showError();
                });

        }, 250);
    }

    private onPressAttachmentButton = async () => {

        const fetchProgress = (_text: string,_progress: number) => {
            this.progressText = _text;
            this.setState({ progressValue: _progress });
        }

        const file = await FileHandler.pickFile(false);

        if (!file) { return; }

        const shouldUpload = await this.showFileDialog(file);

        if (!shouldUpload) {
            RX.Modal.dismiss('filesendingdialog');
            return;
        }

        RX.Modal.dismiss('filesendingdialog');

        const tempId = 'media' + Date.now();

        this.props.showTempSentMessage({ body: '[' + sending[this.language] + file.name + ']', tempId: tempId });

        this.setState({ showProgress: true });

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
                    let mediaHeight: number | undefined;
                    let mediaWidth: number | undefined;

                    switch (messageType) {
                        case 'm.image':
                            mediaHeight = file.imageHeight;
                            mediaWidth = file.imageWidth;
                            break;

                        case 'm.video':
                            mediaHeight = this.videoHeight;
                            mediaWidth = this.videoWidth;
                            break;

                        default:
                            mediaHeight = undefined;
                            mediaWidth = undefined;
                            break;
                    }

                    let thumbnailInfo: ThumbnailInfo_ | undefined;
                    if (response.thumbnailInfo) {
                        thumbnailInfo = {
                            mimetype: response.thumbnailInfo.mimeType,
                            size: response.thumbnailInfo.fileSize,
                            h: response.thumbnailInfo.height,
                            w: response.thumbnailInfo.width,
                        }
                    }

                    const messageContentInfo: MessageEventContentInfo_ = {
                        h: mediaHeight,
                        w: mediaWidth,
                        size: response.fileSize || file.size!,
                        mimetype: response.mimeType || file.type,
                        thumbnail_url: response.thumbnailUrl || undefined,
                        thumbnail_info: thumbnailInfo || undefined,
                    }

                    const messageContent: MessageEventContent_ = {
                        msgtype: messageType,
                        body: response.fileName || file.name,
                        info: messageContentInfo,
                        url: response.uri,
                    }

                    ApiClient.sendMessage(this.props.roomId, messageContent, tempId)
                        .catch(_error => {

                            this.props.showTempSentMessage({ body: '', tempId: tempId });

                            const text = (
                                <RX.Text style={ styles.textDialog }>
                                    { messageCouldNotBeSent[this.language] }
                                </RX.Text>
                            );

                            RX.Modal.show(<DialogContainer content={ text }/>, 'errordialog');
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

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { fileCouldNotUpload[this.language] }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
            });
    }

    private showFileDialog = (file: FileObject): Promise<boolean> => {

        RX.Modal.dismissAll();
        this.textInputComponent?.blur();

        return new Promise(resolve => {

            let content: ReactElement;

            if (file.type.startsWith('image')) {

                const heightStyle = RX.Styles.createViewStyle({
                    height: (DIALOG_WIDTH - 2 * SPACING) * file.imageHeight! / file.imageWidth!,
                    maxHeight: UiStore.getAppLayout_().screenHeight - BUTTON_HEIGHT - 2 * OBJECT_MARGIN,
                }, false);

                content = (
                    <RX.View style={ styles.containerContent } >
                        <RX.Image
                            resizeMode={ 'contain' }
                            style={ [styles.image, heightStyle] }
                            source={ file.uri }
                        />
                    </RX.View>
                );

            } else if (file.type.startsWith('video')) {

                const setDimensions = (videoHeight: number, videoWidth: number) => {
                    this.videoHeight = videoHeight;
                    this.videoWidth = videoWidth;
                }

                content = (
                    <RX.View style={ styles.containerContent }>
                        <RX.View style={ styles.containerVideo }>
                            <VideoPlayer
                                uri={ file.uri }
                                mimeType={ file.type || 'video/mp4' }
                                autoplay={ false }
                                setDimensions={ setDimensions }
                            />
                        </RX.View>
                    </RX.View>
                );

            } else {

                content = (
                    <RX.Text style={ styles.textDialog }>
                        <RX.Text style={ styles.fileName }>
                            { file.name }
                        </RX.Text>
                    </RX.Text>
                );
            }

            const dialog = (
                <DialogContainer
                    content={ content }
                    confirmButton={ true }
                    confirmButtonText={ this.props.roomType === 'notepad' ? pressLoad[this.language] : pressSend[this.language] }
                    cancelButton={ true }
                    cancelButtonText={ cancel[this.language] }
                    onConfirm={ () => resolve(true) }
                    onCancel={ () => resolve(false) }
                />
            );

            RX.Modal.show(dialog, 'filesendingdialog');
        });
    }

    private onKeyPress = (event: RX.Types.KeyboardEvent) => {

        if (this.state.textInput !== undefined) {
            this.setState({ textInput: undefined });
        }

        if (this.state.sendDisabled) { return }

        if (event.shiftKey && event.key === 'Enter') {

            event.preventDefault();

            this.onPressSendButton().catch(_error => null);
        }
    }

    private showJitsiMeetDialog = (): Promise<boolean> => {

        RX.Modal.dismissAll();

        return new Promise(resolve => {
            const text = (
                <RX.Text style={ styles.textDialog }>
                    <RX.Text>
                        { pressOKJitsi[this.language + '_' + this.props.roomType.substr(0, 2)] }
                    </RX.Text>
                </RX.Text>
            );

            const jitsiMeetDialog = (
                <DialogContainer
                    content={ text }
                    confirmButton={ true }
                    confirmButtonText={ 'OK' }
                    cancelButton={ true }
                    cancelButtonText={ cancel[this.language] }
                    onConfirm={ () => { resolve(true) } }
                    onCancel={ () => { resolve(false) } }
                />
            );

            RX.Modal.show(jitsiMeetDialog, 'jitsiMeetDialog');
        });
    }

    private startJitsiMeet = async () => {

        this.textInputComponent?.blur();

        const shouldJoin = await this.showJitsiMeetDialog();

        if (!shouldJoin) {

            RX.Modal.dismiss('jitsiMeetDialog');
            return;
        }

        RX.Modal.dismiss('jitsiMeetDialog');

        const jitsiMeetId =  APP_ID + '.' + this.props.roomId.substr(1, 15).toLowerCase();

        const tempId = 'text' + Date.now();

        const tempMessage = jitsiStartedInternal[this.language];

        this.props.showTempSentMessage({ body: tempMessage, tempId: tempId });

        const messageContent: MessageEventContent_ = {
            msgtype: 'm.text',
            body: jitsiStartedExternal[this.language] + '?' + jitsiMeetId,
            jitsi_started: true,
        }

        ApiClient.sendMessage(this.props.roomId, messageContent, tempId)
            .catch(_error => {

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { messageCouldNotBeSent[this.language] }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'errordialog');
            });

        this.props.showJitsiMeet(jitsiMeetId);
    }

    private onSelectionChange = (start: number, end: number) => {

        this.selection = { start: start, end: end };
    }

    private addEmoji = (_event: RX.Types.SyntheticEvent, emoji: string) => {

        if (!this.selection) {
            this.selection = { start: this.textInput.length, end: this.textInput.length };
        }

        this.textInput = this.textInput.substr(0, this.selection?.start) + emoji + this.textInput.substr(this.selection?.end || 0);
        this.selection = { start: this.selection.start + emoji.length, end: this.selection.start + emoji.length };

        this.setState({ textInput: this.textInput }, () => {
            if (this.isWeb || this.isAndroid) {
                this.textInputComponent!.focus();
                this.textInputComponent?.selectRange(this.selection!.start, this.selection!.end);
            }
        });
    }

    private toggleEmojiPicker = () => {

        if (!this.emojiPicker) { return; }

        this.textInputComponent?.requestFocus();

        const popupOptions: RX.Types.PopupOptions = {
            getAnchor: () => {
                return this.textInputComponent!;
            },
            getElementTriggeringPopup: () => {
                return this.buttonComponent!;
            },
            renderPopup: (_anchorPosition: RX.Types.PopupPosition, _anchorOffset: number, _popupWidth: number, _popupHeight: number) => {
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
    }

    private onCancelReply = () => {
        this.setState({ showReplyMessage: false });
    }

    public render(): ReactElement | null {

        const disabledOpacity = 0.4;

        let progressDialog: ReactElement | undefined;
        if (this.state.showProgress) {
            progressDialog = (
                <ProgressDialog
                    text={ this.progressText }
                    value={ this.state.progressValue }
                />
            )
        }

        let replyMessage: ReactElement | undefined;
        if (this.state.showReplyMessage) {

            replyMessage = (
                <ReplyMessage
                    replyEvent={ this.replyEvent! }
                    roomId={ this.props.roomId }
                    onCancelButton={ this.onCancelReply }
                />
            )
        }

        return(
            <RX.View style={ styles.container }>
                <RX.Button
                    style={ styles.button }
                    onPress={ this.startJitsiMeet }
                    disableTouchOpacityAnimation={ true }
                    disabled={
                        this.state.offline
                        || this.state.jitsiActive
                        || ['community', 'notepad'].includes(this.props.roomType)
                        || !this.props.roomActive
                    }
                    disabledOpacity={ disabledOpacity }
                    activeOpacity={ 1 }
                >
                    <IconSvg
                        source= { require('../resources/svg/video.json') as SvgFile }
                        fillColor={ BUTTON_FILL }
                        height={ 20 }
                        width={ 20 }
                        style={ { marginLeft: 3 }}
                    />
                </RX.Button>
                <RX.Button
                    style={ styles.button }
                    onPress={ this.onPressAttachmentButton }
                    disableTouchOpacityAnimation={ true }
                    disabled={ this.state.offline || !this.props.roomActive }
                    disabledOpacity={ disabledOpacity }
                    activeOpacity={ 1 }
                >
                    <IconSvg
                        source= { require('../resources/svg/plus.json') as SvgFile }
                        fillColor={ BUTTON_FILL }
                        height={ 18 }
                        width={ 18 }
                    />
                </RX.Button>
                <RX.Button
                    style={ styles.button }
                    ref={ component => this.buttonComponent = component! }
                    onPressIn={ this.toggleEmojiPicker }
                    disableTouchOpacityAnimation={ true }
                    disabled={ !this.props.roomActive }
                    disabledOpacity={ disabledOpacity }
                    activeOpacity={ 1 }
                >
                    <IconSvg
                        source= { require('../resources/svg/smiley.json') as SvgFile }
                        fillColor={ BUTTON_FILL }
                        height={ 18 }
                        width={ 18 }
                        style={ { marginRight: 3 }}
                    />
                </RX.Button>
                <RX.View style={ styles.textInputContainer }>

                    { replyMessage }

                    <RX.TextInput
                        style={ [styles.textInput, this.textInputStyle] }
                        ref={ component => this.textInputComponent = component! }
                        onKeyPress={ this.onKeyPress }
                        onChangeText={ textInput => this.textInput = textInput }
                        value={ this.state.textInput }
                        editable={ this.props.roomActive || false }
                        keyboardType={ 'default' }
                        disableFullscreenUI={ true }
                        allowFontScaling={ false }
                        autoCapitalize={ 'sentences' }
                        autoCorrect={ this.isWeb ? undefined : true }
                        autoFocus={ false }
                        spellCheck={ this.isWeb ? undefined : true }
                        multiline={ true }
                        onSelectionChange={ this.onSelectionChange }
                    />
                </RX.View>
                <RX.Button
                    style={ styles.buttonSend }
                    title={ clickHereOrPressShftEnter[this.language] }
                    onPress={ this.onPressSendButton }
                    disableTouchOpacityAnimation={ true }
                    disabled={ this.state.offline || !this.props.roomActive || this.state.sendDisabled }
                    disabledOpacity={ disabledOpacity }
                    activeOpacity={ 1 }
                >
                    <IconSvg
                        source= { require('../resources/svg/send.json') as SvgFile }
                        fillColor={ BUTTON_FILL }
                        height={ 18 }
                        width={ 18 }
                    />
                </RX.Button>
                { progressDialog }
            </RX.View>
        );
    }
}
