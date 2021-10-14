import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { APP_ID, JITSI_SERVER_URL } from '../appconfig';
import { EMOJI_TEXT, INPUT_TEXT, BORDER_RADIUS, SPACING, FONT_LARGE, BUTTON_ROUND_WIDTH, LOGO_BACKGROUND,
    BUTTON_COMPOSER_WIDTH, OPAQUE_BACKGROUND, COMPOSER_BORDER, DIALOG_WIDTH, MODAL_CONTENT_BACKGROUND, FONT_EMOJI_LARGE,
    INPUT_BACKGROUND, BUTTON_HEIGHT, OBJECT_MARGIN} from '../ui';
import FileHandler from '../modules/FileHandler';
import ApiClient from '../matrix/ApiClient';
import DialogContainer from '../modules/DialogContainer';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import { StyleRuleSet, TextStyle } from 'reactxp/dist/common/Types';
import { messageCouldNotBeSent, cancel, wrote, sending, clickHereOrPressShftEnter, pressOKJitsi, jitsiStartedExternal,
    jitsiStartedInternal, fileCouldNotUpload, pressSend, pressLoad, Languages } from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import EmojiPicker from './EmojiPicker';
import utils from '../utils/Utils';
import { MessageEventContent_, RoomType } from '../models/MatrixApi';
import { FileObject } from '../models/FileObject';
import { TemporaryMessage } from '../models/MessageEvent';
import AppFont from '../modules/AppFont';
import JitsiMeet from '../modulesNative/JitsiMeet';

const styles = {
    container: RX.Styles.createViewStyle({
        flexDirection: 'row',
        marginBottom: SPACING + 1,
        paddingBottom: SPACING,
        borderBottomWidth: 1,
        borderColor: COMPOSER_BORDER,
    }),
    textInput: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        flex: 1,
        fontSize: FONT_LARGE,
        borderRadius: BORDER_RADIUS,
        marginLeft: SPACING / 2,
        marginRight: SPACING / 2,
        backgroundColor: INPUT_BACKGROUND,
        lineHeight: FONT_LARGE + 4,
        paddingHorizontal: SPACING,
        textAlignVertical: 'center',
        minHeight: BUTTON_COMPOSER_WIDTH,
    }),
    button: RX.Styles.createViewStyle({
        width: BUTTON_COMPOSER_WIDTH,
        height: BUTTON_COMPOSER_WIDTH,
    }),
    buttonSend: RX.Styles.createViewStyle({
        width: BUTTON_ROUND_WIDTH + SPACING / 2,
        height: BUTTON_COMPOSER_WIDTH,
    }),
    containerIcon: RX.Styles.createViewStyle({
        flex: 1,
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
        backgroundColor: INPUT_BACKGROUND,
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
    image: RX.Styles.createImageStyle({
        flex: 1,
        borderRadius: BORDER_RADIUS - 2,
    }),
};

type EmojiFile = { [emoji: string]: { text: string, name: string } };

interface ComposerProps extends RX.CommonProps {
    roomId: string;
    roomType: RoomType;
    showTempSentMessage: (message: TemporaryMessage) => void;
    replyMessage: TemporaryMessage;
    showJitsiMeet: (id: string) => void;
    roomActive: boolean;
}

interface ComposerState {
    textInput: string | undefined;
    offline: boolean;
    jitsiActive: boolean;
    sendDisabled: boolean;
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
    private textInput = '';
    private textInputStyle: StyleRuleSet<TextStyle>;
    private language: Languages = 'en';
    private isAndroid: boolean;
    private isWeb: boolean;
    private selection: { start: number, end: number } | undefined;
    private emojiPicker: ReactElement | undefined;

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
            this.getTextInputFromStorage(nextProps.roomId);

        } else if (this.props.roomId !== nextProps.roomId) {

            this.setTextInputToStorage(this.props.roomId);
            this.getTextInputFromStorage(nextProps.roomId);

        } else if (nextProps.replyMessage && (!this.props.replyMessage || (nextProps.replyMessage !== this.props.replyMessage))) {

            const separator = '········································\n';
            const separatorIndex = nextProps.replyMessage.body.lastIndexOf(separator);
            const replyBody = nextProps.replyMessage.body.substring(separatorIndex > -1 ? separatorIndex + separator.length : 0);
            const replyMessage =
                nextProps.replyMessage.senderId + ' ' + wrote[this.language] + ':\n'
                + replyBody + '\n'
                + separator;

            partialState.textInput = replyMessage;
            this.textInput = replyMessage;
            this.textInputComponent!.focus();
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
    }

    public componentWillUnmount(): void {
        super.componentWillUnmount();

        this.setTextInputToStorage(this.props.roomId);

        RX.Popup.dismissAll();
    }

    private getEmojiArray = (): ReactElement[] => {

        const emojiJson = require('../resources/emoji/emoji.json') as EmojiFile;

        return Object.values(emojiJson)
            .map((emoji, i: number) => {
                return (
                    <RX.Button
                        key={ i }
                        style={ styles.emojiButton }
                        onPress={ event => this.addEmoji(event, emoji.text) }
                        disableTouchOpacityAnimation={ true }
                    >
                        <RX.Text style={ styles.emoji }>
                            { emoji.text }
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

        const linkifyElement = utils.getOnlyUrl(textInput);

        if (linkifyElement) {

            let urlMessageContent: MessageEventContent_ = {
                msgtype: 'm.text',
                body: textInput,
            }

            const previewData = await utils.getLinkPreview(linkifyElement);

            if (previewData) {
                urlMessageContent = {
                    ...urlMessageContent,
                    url_preview: previewData,
                }
            }

            ApiClient.sendTextMessage(this.props.roomId, urlMessageContent, tempId)
                .then((_response) => {
                    this.setState({ sendDisabled: false });
                })
                .catch(_error => {
                    showError();
                });

        } else {

            setTimeout(() => {

                const messageContent = {
                    msgtype: 'm.text',
                    body: textInput,
                }

                ApiClient.sendTextMessage(this.props.roomId, messageContent, tempId)
                    .then((_response) => {
                        this.setState({ sendDisabled: false });
                    })
                    .catch(_error => {
                        showError();
                    });

            }, 250);
        }
    }

    private onPressAttachmentButton = async () => {

        const fetchProgress = (_progress: number) => {
            // not used yet
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

        FileHandler.uploadFile(ApiClient.credentials, file, fetchProgress)
            .then(fileUri => {

                if (fileUri) {

                    ApiClient.sendMediaMessage(
                        this.props.roomId,
                        file.name,
                        file.type,
                        file.size!,
                        fileUri,
                        tempId,
                        file.imageWidth!,
                        file.imageHeight!
                    )
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

        ApiClient.sendTextMessage(this.props.roomId, messageContent, tempId)
            .catch(_error => {

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { messageCouldNotBeSent[this.language] }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'errordialog');
            });

        // this.props.showJitsiMeet(jitsiMeetId);

        const options = {
            room: jitsiMeetId,
            serverUrl: JITSI_SERVER_URL,
            userInfo: {
                displayName: ApiClient.credentials.userId,
            },
            featureFlags: {
                'add-people.enabled': false,
                'calendar.enabled': false,
                'call-integration.enabled': true,
                'chat.enabled': false,
                'conference-timer.enabled': false,
                'filmstrip.enabled': true,
                'fullscreen.enabled': false,
                'invite.enabled': false,
                'meeting-name.enabled': false,
                'notifications.enabled': false,
                'overflow-menu.enabled': false,
                'pip.enabled': false,
                'tile-view.enabled': false,
                'toolbox.alwaysVisible': true,
                'resolution': 240,
            }
        }

        JitsiMeet.launch(options);

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

        this.textInputComponent?.focus();

        const popupOptions: RX.Types.PopupOptions = {
            getAnchor: () => {
                return this.textInputComponent!;
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

    public render(): JSX.Element | null {

        const disabledOpacity = 0.4;

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
                    <RX.View style={ styles.containerIcon }>
                        <IconSvg
                            source= { require('../resources/svg/video.json') as SvgFile }
                            fillColor={ LOGO_BACKGROUND }
                            height={ 16 }
                            width={ 16 }
                            style={ { marginLeft: 3 }}
                        />
                    </RX.View>
                </RX.Button>
                <RX.Button
                    style={ styles.button }
                    onPress={ this.onPressAttachmentButton }
                    disableTouchOpacityAnimation={ true }
                    disabled={ this.state.offline || !this.props.roomActive }
                    disabledOpacity={ disabledOpacity }
                    activeOpacity={ 1 }
                >
                    <RX.View style={ styles.containerIcon }>
                        <IconSvg
                            source= { require('../resources/svg/plus.json') as SvgFile }
                            fillColor={ LOGO_BACKGROUND }
                            height={ 20 }
                            width={ 20 }
                        />
                    </RX.View>
                </RX.Button>
                <RX.Button
                    style={ styles.button }
                    onPressIn={ this.toggleEmojiPicker }
                    disableTouchOpacityAnimation={ true }
                    disabled={ !this.props.roomActive }
                    disabledOpacity={ disabledOpacity }
                    activeOpacity={ 1 }
                >
                    <RX.View style={ styles.containerIcon }>
                        <IconSvg
                            source= { require('../resources/svg/smiley.json') as SvgFile }
                            fillColor={ LOGO_BACKGROUND }
                            height={ 16 }
                            width={ 16 }
                            style={ { marginRight: 3 }}
                        />
                    </RX.View>
                </RX.Button>
                <RX.TextInput
                    style={ [styles.textInput, this.textInputStyle] }
                    ref={ component => { this.textInputComponent = component! } }
                    onKeyPress={ this.onKeyPress }
                    onChangeText={ textInput => this.textInput = textInput }
                    value={ this.state.textInput }
                    editable={ this.props.roomActive || false }
                    keyboardType={ 'default' }
                    disableFullscreenUI={ true }
                    allowFontScaling={ false }
                    autoCapitalize={ 'sentences' }
                    autoCorrect={ true }
                    autoFocus={ false }
                    spellCheck={ true }
                    multiline={ true }
                    onSelectionChange={ this.onSelectionChange }
                />
                <RX.Button
                    style={ styles.buttonSend }
                    title={ clickHereOrPressShftEnter[this.language] }
                    onPress={ this.onPressSendButton }
                    disableTouchOpacityAnimation={ true }
                    disabled={ this.state.offline || !this.props.roomActive || this.state.sendDisabled }
                    disabledOpacity={ disabledOpacity }
                    activeOpacity={ 1 }
                >
                    <RX.View style={ styles.containerIcon }>
                        <IconSvg
                            source= { require('../resources/svg/send.json') as SvgFile }
                            fillColor={ LOGO_BACKGROUND }
                            height={ 20 }
                            width={ 20 }
                        />
                    </RX.View>
                </RX.Button>
            </RX.View>
        );
    }
}
