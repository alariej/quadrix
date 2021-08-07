import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { APP_ID } from '../appconfig';
import { EMOJI_TEXT, TILE_BACKGROUND, FONT_FAMILY, INPUT_TEXT, BORDER_RADIUS, SPACING, FONT_LARGE, BUTTON_ROUND_WIDTH, LOGO_BACKGROUND,
    BUTTON_COMPOSER_WIDTH, OPAQUE_BACKGROUND, COMPOSER_BORDER, DIALOG_WIDTH, MODAL_CONTENT_BACKGROUND } from '../ui';
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

const styles = {
    container: RX.Styles.createViewStyle({
        flexDirection: 'row',
        marginBottom: SPACING + 1,
        paddingBottom: SPACING,
        borderBottomWidth: 1,
        borderColor: COMPOSER_BORDER,
    }),
    textInput: RX.Styles.createTextStyle({
        flex: 1,
        fontSize: FONT_LARGE,
        borderRadius: BORDER_RADIUS,
        marginLeft: SPACING / 2,
        marginRight: SPACING / 2,
        backgroundColor: TILE_BACKGROUND,
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
        textAlign: 'center',
        color: INPUT_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
    fileName: RX.Styles.createTextStyle({
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
        marginTop: SPACING * 3,
        height: 260,
        width: 260,
        padding: SPACING,
    }),
    emoji: RX.Styles.createTextStyle({
        color: EMOJI_TEXT,
        fontSize: 28,
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
    private fontFamilyStyle: StyleRuleSet<TextStyle>;
    private language: Languages = 'en';
    private emojiArray: ReactElement[] | undefined;
    private isMobile: boolean;
    private isAndroid: boolean;
    private isWeb: boolean;

    constructor(props: ComposerProps) {
        super(props);

        this.language = UiStore.getLanguage();
        this.getEmojiArray().catch(_error => null);

        const platform = UiStore.getPlatform();
        this.isWeb = platform === 'web';
        this.isAndroid = platform === 'android';
        this.isMobile = UiStore.getDevice() === 'mobile';

        if (this.isWeb) {
            this.fontFamilyStyle = RX.Styles.createTextStyle({
                fontFamily: FONT_FAMILY,
            }, false);
        }

        const numLines = 10;
        const paddingVertical = this.isAndroid ? 2 : (BUTTON_COMPOSER_WIDTH - (FONT_LARGE + 4)) / 2;
        const maxHeightPadding = this.isAndroid ? -1 * (numLines + 1) : paddingVertical * 2;
        this.textInputStyle = RX.Styles.createTextStyle({
            paddingVertical: paddingVertical,
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

    public componentWillUnmount(): void {

        super.componentWillUnmount();

        this.setTextInputToStorage(this.props.roomId);

        RX.Popup.dismissAll();
    }

    private getEmojiArray = (): Promise<void> => {

        const emojiJson = require('../resources/emoji/emoji.json') as EmojiFile;

        this.emojiArray = Object.values(emojiJson)
            .map((emoji, i: number) => {

                return (
                    <RX.Button
                        key={ i }
                        style={ styles.emojiButton }
                        onPress={ event => this.addEmoji(event, emoji.text) }
                        disableTouchOpacityAnimation={ true }
                    >
                        <RX.Text style={ [styles.emoji, this.fontFamilyStyle] }>
                            { emoji.text }
                        </RX.Text>
                    </RX.Button>
                );
            });

        return Promise.resolve();
    }

    private getTextInputFromStorage = (roomId: string) => {

        RX.Storage.getItem('composer' + roomId)
            .then((textInput) => {

                if (textInput) {
                    this.textInput = textInput;
                    this.setState({ textInput: textInput });
                }
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

        RX.Popup.dismiss('emojiPicker');

        const textInput = this.textInput;
        this.textInput = '';
        this.setState({
            textInput: '',
            sendDisabled: true,
        });

        const tempId = 'text' + Date.now();

        this.props.showTempSentMessage({ body: textInput, tempId: tempId });

        const showError = () => {

            this.textInput = textInput;
            this.setState({ textInput: textInput });

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
                    maxHeight: 480,
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

        this.props.showJitsiMeet(jitsiMeetId);
    }

    private addEmoji = (event: RX.Types.SyntheticEvent, emoji: string) => {

        event.stopPropagation();

        this.textInput = this.textInput + emoji;
        this.setState({ textInput: this.textInput });

        if (this.isWeb && !this.isMobile) {
            this.textInputComponent!.focus();
        }
    }

    private toggleEmojiPicker = () => {

        if (!RX.Popup.isDisplayed('emojiPicker') && (!this.isWeb || (this.isWeb && this.isMobile))) {
            this.textInputComponent!.blur();
        }

        const emojiPicker = (
            <RX.View style={ styles.emojiPicker }>
                <EmojiPicker emojiArray={ this.emojiArray! } />
            </RX.View>
        );

        const popupOptions: RX.Types.PopupOptions = {
            getAnchor: () => {
                return this.textInputComponent!;
            },
            renderPopup: (_anchorPosition: RX.Types.PopupPosition, _anchorOffset: number, _popupWidth: number, _popupHeight: number) => {
                return emojiPicker;
            },
            preventDismissOnPress: this.isWeb && !this.isMobile,
            dismissIfShown: true,
            onAnchorPressed: () => {
                if (this.isWeb && this.isMobile) {
                    RX.Popup.dismiss('emojiPicker');
                }
            },
            onDismiss: () => {
                this.textInputComponent!.focus();
            },
        };

        RX.Popup.show(popupOptions, 'emojiPicker', 0);
    }

    public render(): JSX.Element | null {

        const disabledOpacity = 0.4;

        const emojiButton = (
            <RX.Button
                style={ styles.button }
                onPress={ this.toggleEmojiPicker }
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
        );

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

                { emojiButton }

                <RX.TextInput
                    style={ [styles.textInput, this.fontFamilyStyle, this.textInputStyle] }
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
