import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { MessageEvent, TemporaryMessage } from '../models/MessageEvent';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import MessageTile from '../components/MessageTile';
import DialogRoomPicker from './DialogRoomPicker';
import { OPAQUE_BACKGROUND, BUTTON_MODAL_BACKGROUND, BUTTON_MODAL_TEXT, BUTTON_DISABLED_TEXT, BORDER_RADIUS, BUTTON_HEIGHT, FONT_LARGE,
    SPACING, BUTTON_SHORT_WIDTH, TRANSPARENT_BACKGROUND, LOGO_BACKGROUND, OPAQUE_LIGHT_BACKGROUND } from '../ui';
import { LayoutInfo } from 'reactxp/dist/common/Types';
import DataStore from '../stores/DataStore';
import ApiClient from '../matrix/ApiClient';
import ModalSpinner from '../components/ModalSpinner';
import DialogContainer from '../modules/DialogContainer';
import { forward, reply, forwardTo, messageCouldNotBeSent, noApplicationWasFound, open, save, share, fileCouldNotAccess, fileHasBeenSaved,
    fileHasBeenSavedAndroid, fileCouldNotBeSaved, Languages, report, messageHasBeenReported, cancel,
    doYouReallyWantToReport, pressOKToForward1, pressOKToForward2} from '../translations';
import FileHandler from '../modules/FileHandler';
import ShareHandlerOutgoing from '../modules/ShareHandlerOutgoing';
import { ErrorResponse_, RoomType } from '../models/MatrixApi';

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
    spinnerContainer: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        justifyContent: 'center',
        alignItems: 'center',
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
}

interface DialogMessageTileState {
    offline: boolean;
    showSpinner: boolean;
    showConfirmationDialog: boolean;
}

export default class DialogMessageTile extends ComponentBase<DialogMessageTileProps, DialogMessageTileState> {

    private language: Languages = 'en';
    private isElectron: boolean;
    private isMobile: boolean;
    private isFileOrImage: boolean;
    private animatedValue: RX.Animated.Value;
    private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
    private confirmationDialog: ReactElement | undefined;

    constructor(props: DialogMessageTileProps) {
        super(props);

        this.language = UiStore.getLanguage();
        this.isElectron = UiStore.getIsElectron();
        this.isMobile = ['android', 'ios'].includes(UiStore.getPlatform());
        this.isFileOrImage = ['m.file', 'm.image'].includes(this.props.event.content.msgtype!);

        this.animatedValue = RX.Animated.createValue(0.4);
        this.animatedStyle = RX.Styles.createAnimatedViewStyle({
            transform: [{ scale: this.animatedValue }]
        });
    }

    protected _buildState(_nextProps: DialogMessageTileProps, initState: boolean, _prevState: DialogMessageTileState)
        : Partial<DialogMessageTileState> {

        const partialState: Partial<DialogMessageTileState> = {};

        if (initState) {
            partialState.showConfirmationDialog = false;
            partialState.showSpinner = false;
        }

        partialState.offline = UiStore.getOffline();

        return partialState;
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

    private showRoomList = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        this.confirmationDialog = (
            <DialogRoomPicker
                onPressRoom={ this.confirmForwardMessage }
                label={ forwardTo[this.language] + '...' }
                backgroundColor={ OPAQUE_LIGHT_BACKGROUND }
            />
        );

        this.setState({ showConfirmationDialog: true });
    }

    private confirmForwardMessage = (roomId: string) => {

        this.setState({ showConfirmationDialog: false });

        const text = (
            <RX.Text style={ styles.textDialog }>
                <RX.Text>
                    { pressOKToForward1[this.language] }
                </RX.Text>
                <RX.Text style={ styles.boldText }>
                    { ' ' + DataStore.getRoomName(roomId) }
                </RX.Text>
                <RX.Text>
                    { ' ' + pressOKToForward2[this.language] }
                </RX.Text>
            </RX.Text>
        );

        this.confirmationDialog = (
            <DialogContainer
                content={ text }
                confirmButton={ true }
                confirmButtonText={ 'OK' }
                cancelButton={ true }
                backgroundColor={ OPAQUE_LIGHT_BACKGROUND }
                cancelButtonText={ cancel[this.language] }
                onConfirm={ () => this.forwardMessage(roomId) }
                onCancel={ () => RX.Modal.dismissAll() }
            />
        );

        this.setState({ showConfirmationDialog: true });
    }

    private forwardMessage = (roomId: string) => {

        RX.Modal.dismiss('dialogMessageTile');

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

    private confirmReportMessage = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        const text = (
            <RX.Text style={ styles.textDialog }>
                { doYouReallyWantToReport[this.language] }
            </RX.Text>
        );

        this.confirmationDialog = (
            <DialogContainer
                content={ text }
                confirmButton={ true }
                confirmButtonText={ 'OK' }
                cancelButton={ true }
                backgroundColor={ OPAQUE_LIGHT_BACKGROUND }
                cancelButtonText={ cancel[this.language] }
                onConfirm={ this.reportMessage }
                onCancel={ () => RX.Modal.dismissAll() }
            />
        );

        this.setState({ showConfirmationDialog: true });
    }

    private reportMessage = () => {

        this.confirmationDialog = undefined;
        this.setState({
            showConfirmationDialog: false,
            showSpinner: true,
        });

        ApiClient.reportMessage(this.props.roomId, this.props.event.eventId)
            .then(_response => {

                RX.Modal.dismiss('dialogMessageTile');

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { messageHasBeenReported[this.language] }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'messageReported' }/>, 'messageReported');
            })
            .catch((error: ErrorResponse_) => {

                RX.Modal.dismiss('dialogMessageTile');

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { error.body && error.body.error ? error.body.error : '[Unknown error]' }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
            });
    }

    public render(): JSX.Element | null {

        let contextMenu: ReactElement | undefined;
        let openButton: ReactElement | undefined;
        let saveAsButton: ReactElement | undefined;
        let shareButton: ReactElement | undefined;
        let forwardButton: ReactElement | undefined;
        let replyButton: ReactElement | undefined;
        let forwardConfirmButton: ReactElement | undefined;
        let reportButton: ReactElement | undefined;
        let n;

        if (!this.state.showConfirmationDialog && !this.state.showSpinner) {

            n = 1;
            if (this.isFileOrImage && (this.isElectron || this.isMobile)) {
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

            if (this.isFileOrImage && (this.isElectron || this.isMobile)) {
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

            if (this.isMobile) {
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

            if (this.props.roomType === 'community') {
                n++;
                reportButton = (
                    <RX.Button
                        style={ [styles.buttonDialog, { width: BUTTON_SHORT_WIDTH }] }
                        onPress={ this.confirmReportMessage }
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                        disabled={ this.state.offline }
                        disabledOpacity={ 1 }
                    >
                        <RX.Text style={ [styles.buttonText, { color: this.state.offline ? BUTTON_DISABLED_TEXT : 'red' }] }>
                            { report[this.language] }
                        </RX.Text>
                    </RX.Button>
                );
            }

            const appLayout = UiStore.getAppLayout_();
            const containerHeight = n * (BUTTON_HEIGHT + 2 * SPACING);
            let pos = (this.props.layout.height - containerHeight - SPACING) / 2;
            pos = Math.min(pos, appLayout.screenHeight - this.props.layout.y - containerHeight);
            pos = Math.max(pos, -1 * this.props.layout.y);

            contextMenu = (
                <RX.Animated.View style={ [this.animatedStyle, styles.buttonContainer, { top: pos }] }>
                    { openButton }
                    { saveAsButton }
                    { shareButton }
                    { forwardButton }
                    { replyButton }
                    { forwardConfirmButton }
                    { reportButton }
                </RX.Animated.View>
            )
        }

        let spinner: ReactElement | undefined;
        if (this.state.showSpinner) {
            spinner = (
                <RX.View style={ styles.spinnerContainer }>
                    <RX.ActivityIndicator color={ LOGO_BACKGROUND } size={ 'large' } />
                </RX.View>
            );
        }

        return(
            <RX.View
                style={ styles.modalScreen }
                onPress={ () => { this.state.showConfirmationDialog || this.state.showSpinner ? null : RX.Modal.dismissAll() } }
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
                        disableTouchOpacityAnimation={ true }
                        activeOpacity={ 1 }
                    />
                    { contextMenu }
                </RX.View>
                { this.confirmationDialog }
                { spinner }
            </RX.View>
        );
    }
}
