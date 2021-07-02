import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { MessageEvent, TemporaryMessage } from '../models/MessageEvent';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import MessageTile from '../components/MessageTile';
import DialogRoomPicker from './DialogRoomPicker';
import { OPAQUE_BACKGROUND, BUTTON_MODAL_BACKGROUND, BUTTON_MODAL_TEXT, BUTTON_DISABLED_TEXT, BORDER_RADIUS, BUTTON_HEIGHT, FONT_LARGE,
    SPACING, BUTTON_SHORT_WIDTH, TRANSPARENT_BACKGROUND } from '../ui';
import { LayoutInfo } from 'reactxp/dist/common/Types';
import DataStore from '../stores/DataStore';
import ApiClient from '../matrix/ApiClient';
import ModalSpinner from '../components/ModalSpinner';
import DialogContainer from '../modules/DialogContainer';
import { forward, reply, forwardTo, messageCouldNotBeSent, noApplicationWasFound, open, save, share, fileCouldNotAccess, fileHasBeenSaved,
    fileHasBeenSavedAndroid, fileCouldNotBeSaved, Languages } from '../translations';
import FileHandler from '../modules/FileHandler';
import ShareHandlerOutgoing from '../modules/ShareHandlerOutgoing';
import { RoomType } from '../models/MatrixApi';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        backgroundColor: OPAQUE_BACKGROUND,
    }),
    modalMessage: RX.Styles.createViewStyle({
        position: 'absolute',
        overflow: 'visible',
    }),
    buttonContainer: RX.Styles.createViewStyle({
        position: 'absolute',
        flexDirection: 'column',
        right: -2 * SPACING,
    }),
    buttonDialog: RX.Styles.createViewStyle({
        borderRadius: BUTTON_HEIGHT / 2,
        height: BUTTON_HEIGHT,
        backgroundColor: BUTTON_MODAL_BACKGROUND,
        margin: SPACING,
        shadowOffset: { width: -1, height: 1 },
        shadowColor: OPAQUE_BACKGROUND,
        shadowRadius: 3,
        elevation: 3,
        shadowOpacity: 1,
        overflow: 'visible',
    }),
    buttonText: RX.Styles.createTextStyle({
        fontSize: FONT_LARGE,
        margin: SPACING,
        textAlign: 'center',
        color: BUTTON_MODAL_TEXT,
    }),
    boldText: RX.Styles.createTextStyle({
        fontWeight: 'bold',
    }),
    textDialog: RX.Styles.createTextStyle({
        textAlign: 'center',
        color: BUTTON_MODAL_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
    modalMessageCover: RX.Styles.createViewStyle({
        position: 'absolute',
        borderRadius: BORDER_RADIUS,
        backgroundColor: TRANSPARENT_BACKGROUND,
    }),
};

interface DialogMessageTileProps extends RX.CommonProps {
    roomId: string;
    event: MessageEvent;
    roomType: RoomType;
    readMarkerType?: string;
    setReplyMessage?: (message: TemporaryMessage) => void;
    showTempForwardedMessage?: (roomId: string, message?: MessageEvent, tempId?: string) => void;
    layout: LayoutInfo;
    marginStyle: RX.Types.ViewStyleRuleSet;
    forwardToRoomId?: string;
}

interface DialogMessageTileState {
    offline: boolean;
}

export default class DialogMessageTile extends ComponentBase<DialogMessageTileProps, DialogMessageTileState> {

    private language: Languages = 'en';
    private animatedValue: RX.Animated.Value;
    private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;

    constructor(props: DialogMessageTileProps) {
        super(props);

        this.language = UiStore.getLanguage();

        this.animatedValue = RX.Animated.createValue(0.4);
        this.animatedStyle = RX.Styles.createAnimatedViewStyle({
            transform: [{ scale: this.animatedValue }]
        });
    }

    protected _buildState(): DialogMessageTileState {

        return {
            offline: UiStore.getOffline(),
        };
    }

    public componentDidMount(): void {
        super.componentDidMount();

        RX.Animated.timing(this.animatedValue, {
            duration: 150,
            toValue: 1,
            easing: RX.Animated.Easing.InOutBack(),
            useNativeDriver: true,
        }).start();
    }

    private showRoomList = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        RX.Modal.dismiss('dialogMessageTile');

        const dialogRoomPicker = (
            <DialogRoomPicker
                onPressRoom={ this.askForwardMessage }
                label={ forwardTo[this.language] + '...' }
            />
        );

        RX.Modal.show(dialogRoomPicker, 'DialogRoomPicker');
    }

    private setReplyMessage = () => {

        RX.Modal.dismissAll();

        // HACK: need to have a dynamic element (time)
        // for the state change to trigger a re-render
        const replyMessage: TemporaryMessage = {
            time: Date.now(),
            senderId: this.props.event.senderId,
            body: this.props.event.content.body!,
        }

        this.props.setReplyMessage!(replyMessage);
    }

    private askForwardMessage = (roomId: string) => {

        RX.Modal.dismiss('DialogRoomPicker');

        const dialogMessageTile = (
            <DialogMessageTile
                roomId={ this.props.roomId }
                event={ this.props.event }
                layout={ this.props.layout }
                roomType={ this.props.roomType }
                readMarkerType={ this.props.readMarkerType }
                setReplyMessage={ this.props.setReplyMessage }
                showTempForwardedMessage={ this.props.showTempForwardedMessage }
                marginStyle={ this.props.marginStyle }
                forwardToRoomId={ roomId }
            />
        );

        RX.Modal.show(dialogMessageTile, 'askForwardMessageDialog');
    }

    private forwardMessage = (roomId: string) => {

        RX.Modal.dismiss('askForwardMessageDialog');

        RX.Modal.show(<ModalSpinner/>, 'modalspinner_forwardmessage');

        const showError = () => {

            const text = (
                <RX.Text style={ styles.textDialog }>
                    { messageCouldNotBeSent[this.language] }
                </RX.Text>
            );

            RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');

            this.props.showTempForwardedMessage!(this.props.roomId, undefined, '');
        }

        if (this.props.event.content.msgtype === 'm.text') {

            const tempId = 'text' + Date.now();

            this.props.showTempForwardedMessage!(roomId, this.props.event, tempId);

            ApiClient.sendTextMessage(roomId, this.props.event.content, tempId)
                .catch(_error => {
                    showError();
                });

        } else {

            const tempId = 'media' + Date.now();

            this.props.showTempForwardedMessage!(roomId, this.props.event, tempId);

            ApiClient.sendMediaMessage(
                roomId,
                this.props.event.content.body!,
                this.props.event.content.info!.mimetype!,
                this.props.event.content.info!.size!,
                this.props.event.content.url!,
                tempId,
                this.props.event.content.info!.w!,
                this.props.event.content.info!.h!,
            )
                .catch(_error => {
                    showError();
                });
        }
    }

    private viewFile = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        const fetchProgress = (_progress: number) => {
            // not used yet
        }

        const onSuccess = (success: boolean) => {

            if (success) {

                setTimeout(() => {
                    RX.Modal.dismiss('modalSpinnerViewFile');
                }, 1000);

            } else {

                RX.Modal.dismiss('modalSpinnerViewFile');

                const text = (
                    <RX.Text style={styles.textDialog}>
                        <RX.Text>
                            { fileCouldNotAccess[this.language] }
                        </RX.Text>
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'errorDialog');
            }
        }

        const onNoAppFound = () => {

            RX.Modal.dismiss('modalSpinnerViewFile');

            const text = (
                <RX.Text style={ styles.textDialog }>
                    <RX.Text>
                        { noApplicationWasFound[this.language] }
                    </RX.Text>
                </RX.Text>
            );

            RX.Modal.show(<DialogContainer content={ text }/>, 'warningDialog');
        }

        RX.Modal.dismiss('dialogMessageTile');

        RX.Modal.show(<ModalSpinner/>, 'modalSpinnerViewFile');

        FileHandler.viewFile(this.props.event, fetchProgress, onSuccess, onNoAppFound);
    }

    private saveFile = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        const isAndroid = UiStore.getPlatform() === 'android';

        const fetchProgress = (_progress: number) => {
            // not used yet
        }

        const onSuccess = (success: boolean) => {

            RX.Modal.dismiss('modalSpinnerSaveFile');

            if (success) {

                const message = isAndroid ? fileHasBeenSavedAndroid[this.language] : fileHasBeenSaved[this.language];

                const text = (
                    <RX.Text style={styles.textDialog}>
                        <RX.Text>
                            { message }
                        </RX.Text>
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'successDialog');

            } else {

                const text = (
                    <RX.Text style={styles.textDialog}>
                        <RX.Text>
                            { fileCouldNotBeSaved[this.language] }
                        </RX.Text>
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'errorDialog');
            }
        }

        const onAbort = () => {
            RX.Modal.dismiss('modalSpinnerSaveFile');
        }

        RX.Modal.dismiss('dialogMessageTile');

        RX.Modal.show(<ModalSpinner/>, 'modalSpinnerSaveFile');

        // on electron, without timeout, the dialog does not dismiss and spinner doesn't show
        if (UiStore.getIsElectron()) {

            setTimeout(() => {
                FileHandler.saveFile(this.props.event, fetchProgress, onSuccess, onAbort);
            }, 200);

        } else {

            FileHandler.saveFile(this.props.event, fetchProgress, onSuccess, onAbort);
        }
    }

    private shareExternal = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        const onSuccess = (success: boolean) => {

            if (success) {

                setTimeout(() => {
                    RX.Modal.dismiss('modalSpinnerShare');
                }, 1000);

            } else {

                RX.Modal.dismiss('modalSpinnerShare');

                const text = (
                    <RX.Text style={styles.textDialog}>
                        <RX.Text>
                            { fileCouldNotAccess[this.language] }
                        </RX.Text>
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text }/>, 'errorDialog');
            }
        }

        RX.Modal.dismiss('dialogMessageTile');

        RX.Modal.show(<ModalSpinner/>, 'modalSpinnerShare');

        ShareHandlerOutgoing.shareContent(this.props.event, onSuccess);
    }

    public render(): JSX.Element | null {

        const isElectron = UiStore.getIsElectron();
        const isMobile = ['android', 'ios'].includes(UiStore.getPlatform());
        const isFileOrImage = ['m.file', 'm.image'].includes(this.props.event.content.msgtype!);

        let openButton: ReactElement | undefined;
        let saveAsButton: ReactElement | undefined;
        let shareButton: ReactElement | undefined;
        let forwardButton: ReactElement | undefined;
        let replyButton: ReactElement | undefined;
        let forwardConfirmButton: ReactElement | undefined;
        let n;

        if (!this.props.forwardToRoomId) {

            n = 1;
            if (isFileOrImage && (isElectron || isMobile)) {
                n++;
                openButton = (
                    <RX.Button
                        style={ [styles.buttonDialog, { width: BUTTON_SHORT_WIDTH }] }
                        onPress={ event => this.viewFile(event) }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                        disabled={ this.state.offline }
                        disabledOpacity={ 1 }
                    >
                        <RX.Text style={ [styles.buttonText, this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined] }>
                            { open[this.language] }
                        </RX.Text>
                    </RX.Button>
                )
            }

            if (isFileOrImage && (isElectron || isMobile)) {
                n++;
                saveAsButton = (
                    <RX.Button
                        style={ [styles.buttonDialog, { width: BUTTON_SHORT_WIDTH }] }
                        onPress={ event => this.saveFile(event) }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                        disabled={ this.state.offline }
                        disabledOpacity={ 1 }
                    >
                        <RX.Text style={ [styles.buttonText, this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined] }>
                            { save[this.language] }
                        </RX.Text>
                    </RX.Button>
                )
            }

            if (isMobile) {
                n++;
                shareButton = (
                    <RX.Button
                        style={ [styles.buttonDialog, { width: BUTTON_SHORT_WIDTH }] }
                        onPress={ event => this.shareExternal(event) }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                        disabled={ this.state.offline }
                        disabledOpacity={ 1 }
                    >
                        <RX.Text style={ [styles.buttonText, this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined] }>
                            { share[this.language] }
                        </RX.Text>
                    </RX.Button>
                )
            }

            if (this.props.roomType !== 'notepad') {
                n++;
                replyButton = (
                    <RX.Button
                        style={ [styles.buttonDialog, { width: BUTTON_SHORT_WIDTH }] }
                        onPress={ this.setReplyMessage }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                        disabled={ this.state.offline }
                        disabledOpacity={ 1 }
                    >
                        <RX.Text style={ [styles.buttonText, this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined] }>
                            { reply[this.language] }
                        </RX.Text>
                    </RX.Button>
                );
            }

            forwardButton = (
                <RX.Button
                    style={ [styles.buttonDialog, { width: BUTTON_SHORT_WIDTH }] }
                    onPress={ event => this.showRoomList(event) }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                    disabled={ this.state.offline }
                    disabledOpacity={ 1 }
                >
                    <RX.Text style={ [styles.buttonText, this.state.offline ? { color: BUTTON_DISABLED_TEXT } : undefined] }>
                        { forward[this.language] }
                    </RX.Text>
                </RX.Button>
            );

        } else {

            n = 1;

            const text = (
                <RX.Text>
                    <RX.Text numberOfLines={ 1 }>
                        { forwardTo[this.language] }
                    </RX.Text>
                    <RX.Text numberOfLines={ 1 } style={ styles.boldText }>
                        { ' ' + DataStore.getRoomName(this.props.forwardToRoomId) }
                    </RX.Text>
                </RX.Text>
            );

            forwardConfirmButton = (
                <RX.Button
                    style={ [styles.buttonDialog, { width: 220 }] }
                    onPress={ () => this.forwardMessage(this.props.forwardToRoomId || '') }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    <RX.Text numberOfLines={ 1 } style={ styles.buttonText }>
                        { text }
                    </RX.Text>
                </RX.Button>
            )
        }

        const appLayout = UiStore.getAppLayout_();
        const containerHeight = n * (BUTTON_HEIGHT + 2 * SPACING);
        let pos = (this.props.layout.height - containerHeight - SPACING) / 2;
        pos = Math.min(pos, appLayout.screenHeight - this.props.layout.y - containerHeight);
        pos = Math.max(pos, -1 * this.props.layout.y);

        const contextMenu = (
            <RX.Animated.View style={ [this.animatedStyle, styles.buttonContainer, { top: pos }] }>
                { openButton }
                { saveAsButton }
                { shareButton }
                { forwardButton }
                { replyButton }
                { forwardConfirmButton }
            </RX.Animated.View>
        )

        return(
            <RX.View
                style={ styles.modalScreen }
                onPress={ () => RX.Modal.dismissAll() }
                disableTouchOpacityAnimation={ true }
            >
                <RX.View
                    style={ [
                        styles.modalMessage,
                        {
                            width: this.props.layout.width,
                            height: this.props.layout.height,
                            left: this.props.layout.x,
                            top: this.props.layout.y
                        }
                    ] }
                >
                    <MessageTile
                        roomId={ this.props.roomId }
                        event={ this.props.event }
                        roomType={ this.props.roomType }
                        readMarkerType={ this.props.readMarkerType }
                        isRedacted={ false }
                    />
                    <RX.View
                        style={ [
                            styles.modalMessageCover, {
                                width: this.props.layout.width,
                                height: this.props.layout.height,
                            }
                        ] }
                        onPress={ () => RX.Modal.dismissAll() }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                    />
                    { contextMenu }
                </RX.View>
            </RX.View>
        );
    }
}
