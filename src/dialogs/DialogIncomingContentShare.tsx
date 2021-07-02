import React, { ReactElement } from 'react';
import RX from 'reactxp';
import DialogContainer from '../modules/DialogContainer';
import ApiClient from '../matrix/ApiClient';
import ModalSpinner from '../components/ModalSpinner';
import { MessageEvent } from '../models/MessageEvent';
import FileHandler from '../modules/FileHandler';
import { DIALOG_WIDTH, SPACING, BUTTON_MODAL_TEXT, FONT_LARGE, BORDER_RADIUS, TRANSPARENT_BACKGROUND,
    MODAL_CONTENT_BACKGROUND } from '../ui';
import UiStore from '../stores/UiStore';
import { messageCouldNotBeSent, cancel, pressSend, fileCouldNotUpload, pressLoad, Languages } from '../translations';
import utils from '../utils/Utils';
import RoomTile from '../components/RoomTile';
import { SharedContent } from '../models/SharedContent';
import DataStore from '../stores/DataStore';
import { MessageEventContent_ } from '../models/MatrixApi';
import { FileObject } from '../models/FileObject';
import ImageSizeLocal from '../modules/ImageSizeLocal';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
    }),
    containerModalContent: RX.Styles.createViewStyle({
        width: DIALOG_WIDTH,
    }),
    containerContent: RX.Styles.createViewStyle({
        padding: SPACING,
        marginBottom: SPACING,
        backgroundColor: MODAL_CONTENT_BACKGROUND,
        borderRadius: BORDER_RADIUS,
    }),
    image: RX.Styles.createImageStyle({
        flex: 1,
        borderRadius: BORDER_RADIUS - 2,
    }),
    text: RX.Styles.createTextStyle({
        textAlign: 'center',
        fontSize: FONT_LARGE,
        margin: SPACING,
    }),
    textDialog: RX.Styles.createTextStyle({
        textAlign: 'center',
        color: BUTTON_MODAL_TEXT,
        fontSize: FONT_LARGE,
        margin: SPACING * 2,
    }),
};

interface DialogIncomingContentShareProps {
    roomId: string;
    sharedContent: SharedContent;
    showTempForwardedMessage: (roomId: string, message: MessageEvent, tempId: string) => void;
}

interface DialogIncomingContentShareState {
    imageRatio: number;
}

export default class DialogIncomingContentShare extends RX.Component<DialogIncomingContentShareProps, DialogIncomingContentShareState> {

    private contentType = '';
    private imageHeight = 0;
    private imageWidth = 0;
    private language: Languages = 'en';

    constructor(props: DialogIncomingContentShareProps) {
        super(props);

        if (props.sharedContent.mimeType!.startsWith('image')) {
            this.contentType = 'm.image';
        } else if (props.sharedContent.mimeType!.startsWith('text')) {
            this.contentType = 'm.text';
        } else if (props.sharedContent.mimeType!.startsWith('application')) {
            this.contentType = 'm.file';
        }

        this.state = { imageRatio: 1 }

        this.language = UiStore.getLanguage();
    }

    public async componentDidMount(): Promise<void> {

        if (this.contentType === 'm.image') {

            const imageSize = await ImageSizeLocal.getSize(this.props.sharedContent.uri);

            this.imageWidth = imageSize.width;
            this.imageHeight = imageSize.height;

            this.setState({ imageRatio: this.imageHeight / this.imageWidth });
        }
    }

    private shareContent = async () => {

        RX.Modal.dismiss('dialogIncomingContentShare');

        RX.Modal.show(<ModalSpinner/>, 'modalspinner_forwardmessage');

        const showError = (tempId: string, errorMessage: string) => {

            const message: MessageEvent = {
                eventId: tempId,
                content: undefined!,
                type: '',
                time: 0,
                senderId: '',
            }

            this.props.showTempForwardedMessage(this.props.roomId, message, tempId);

            const text = (
                <RX.Text style={ styles.textDialog }>
                    { errorMessage }
                </RX.Text>
            );

            RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
        }

        if (this.contentType === 'm.text') {

            const tempId = 'text' + Date.now();

            const messageContent = {
                body: this.props.sharedContent.uri,
                msgtype: 'm.text',
            };

            const message: MessageEvent = {
                eventId: tempId,
                content: messageContent,
                type: '',
                time: Date.now(),
                senderId: ApiClient.credentials.userIdFull,
            }

            this.props.showTempForwardedMessage(this.props.roomId, message, tempId);

            const linkifyElement = utils.getOnlyUrl(this.props.sharedContent.uri);

            if (linkifyElement) {

                let urlMessageContent: MessageEventContent_ = {
                    msgtype: 'm.text',
                    body: this.props.sharedContent.uri,
                }

                const previewData = await utils.getLinkPreview(linkifyElement);

                if (previewData) {
                    urlMessageContent = {
                        ...urlMessageContent,
                        url_preview: previewData,
                    }
                }

                ApiClient.sendTextMessage(this.props.roomId, urlMessageContent, tempId)
                    .catch(() => {
                        showError(tempId, messageCouldNotBeSent[this.language]);
                    });

            } else {

                ApiClient.sendTextMessage(this.props.roomId, messageContent, tempId)
                    .catch(() => {
                        showError(tempId, messageCouldNotBeSent[this.language]);
                    });
            }

        } else {

            const tempId = 'media' + Date.now();

            const fetchProgress = (_progress: number) => {
                // not used yet
            }

            const content = {
                body: this.props.sharedContent.fileName,
                msgtype: this.contentType,
            };

            const message: MessageEvent = {
                eventId: tempId,
                content: content,
                type: '',
                time: Date.now(),
                senderId: ApiClient.credentials.userIdFull,
            }

            this.props.showTempForwardedMessage(this.props.roomId, message, tempId);

            const file: FileObject = {
                uri: this.props.sharedContent.uri,
                name: this.props.sharedContent.fileName!,
                size: this.props.sharedContent.fileSize,
                type: this.props.sharedContent.mimeType!,
            }

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
                            this.imageWidth,
                            this.imageHeight
                        )
                            .catch(() => {
                                showError(tempId, messageCouldNotBeSent[this.language]);
                            });

                    } else {
                        throw new Error('');
                    }
                })
                .catch(_error => {
                    showError(tempId, fileCouldNotUpload[this.language])
                });
        }
    }

    public render(): JSX.Element | null {

        const newestRoomEvent = DataStore.getNewRoomEvents(this.props.roomId)[0];

        let content: ReactElement;

        if (this.contentType === 'm.image') {

            const heightStyle = RX.Styles.createViewStyle({
                height: (DIALOG_WIDTH - 2 * SPACING) * this.state.imageRatio,
                maxHeight: 480,
            }, false);

            content = (
                <RX.View style={ styles.containerModalContent }>
                    <RX.View style={ styles.containerContent } >
                        <RX.Image
                            resizeMode={ 'contain' } // required for image to cover the width set in style
                            style={ [styles.image, heightStyle] }
                            source={ this.props.sharedContent.uri }
                        />
                    </RX.View>
                    <RoomTile
                        key={ this.props.roomId }
                        roomId={ this.props.roomId }
                        newestRoomEvent={ newestRoomEvent }
                        nonShadeable={ true }
                    />
                </RX.View>
            );

        } else if (this.contentType === 'm.file') {

            content = (
                <RX.View style={ styles.containerModalContent }>
                    <RX.View style={ styles.containerContent } >
                        <RX.Text style={ [styles.text, { fontWeight: 'bold'}] }>
                            { this.props.sharedContent.fileName }
                        </RX.Text>
                    </RX.View>
                    <RoomTile
                        key={ this.props.roomId }
                        roomId={ this.props.roomId }
                        newestRoomEvent={ newestRoomEvent }
                        nonShadeable={ true }
                    />
                </RX.View>
            );

        } else {

            content = (
                <RX.View style={ styles.containerModalContent }>
                    <RX.View style={ styles.containerContent } >
                        <RX.Text style={ styles.text }>
                            { this.props.sharedContent.uri }
                        </RX.Text>
                    </RX.View>
                    <RoomTile
                        key={ this.props.roomId }
                        roomId={ this.props.roomId }
                        newestRoomEvent={ newestRoomEvent }
                        nonShadeable={ true }
                    />
                </RX.View>
            );
        }

        const roomType = DataStore.getRoomType(this.props.roomId);

        const shareDialog = (
            <DialogContainer
                content={ content }
                confirmButton={ true }
                confirmButtonText={ roomType === 'notepad' ? pressLoad[this.language] : pressSend[this.language] }
                cancelButton={ true }
                cancelButtonText={ cancel[this.language] }
                onConfirm={ this.shareContent }
                onCancel={ () => RX.Modal.dismissAll() }
                backgroundColorContent={ TRANSPARENT_BACKGROUND }
            />
        )

        return (
            <RX.View style={ styles.modalScreen }>
                { shareDialog }
            </RX.View>
        );
    }
}
