import React from 'react';
import RX from 'reactxp';
import DialogRoomPicker from "../../dialogs/DialogRoomPicker";
import DialogIncomingContentShare from '../../dialogs/DialogIncomingContentShare';
import { Linking } from 'react-native';
import { sendTo } from '../../translations';
import UiStore from '../../stores/UiStore';
import { SharedContent } from '../../models/SharedContent';
import { MessageEvent } from '../../models/MessageEvent';

class ShareHandlerIncoming {

    public launchedFromSharedContent(sharedContent: string, shareContent: (event: { url: string }) => void): void {

        if (sharedContent) {

            // android only, bug in RN Linking, need to use native code + initial prop
            // https://github.com/facebook/react-native/issues/25675#issuecomment-801879847

            shareContent({ url: sharedContent });
        }
    }

    public addListener(shareContent: (event: { url: string }) => void): void {

        Linking.addEventListener('url', shareContent)
    }

    public removeListener(shareContent: (event: { url: string }) => void): void {

        Linking.removeEventListener('url', shareContent);
    }

    public shareContent(
        sharedContent_: string,
        showTempForwardedMessage: (roomId: string, message: MessageEvent, tempId: string) => void)
        : void {

        const sharedContent = JSON.parse(sharedContent_) as SharedContent;

        RX.Modal.dismissAll();

        // does not support multi-item-sharing yet
        const dialogRoomPicker = (
            <DialogRoomPicker
                onPressRoom={ roomId => this.askSendContent(roomId, sharedContent, showTempForwardedMessage) }
                label={ sendTo[UiStore.getLanguage()] + '...' }
            />
        );

        RX.Modal.show(dialogRoomPicker, 'DialogRoomPicker');
    }

    private askSendContent(
        roomId: string,
        sharedContent: SharedContent,
        showTempForwardedMessage: (roomId: string, message: MessageEvent, tempId: string) => void)
        : void {

        RX.Modal.dismiss('DialogRoomPicker');

        const dialogIncomingContentShare = (
            <DialogIncomingContentShare
                roomId={ roomId }
                sharedContent={ sharedContent }
                showTempForwardedMessage={ showTempForwardedMessage }
            />
        );

        RX.Modal.show(dialogIncomingContentShare, 'dialogIncomingContentShare');
    }
}

export default new ShareHandlerIncoming();
