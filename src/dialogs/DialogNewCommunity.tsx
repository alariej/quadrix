import React from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import ModalSpinner from '../components/ModalSpinner';
import DialogContainer from '../modules/DialogContainer';
import { BORDER_RADIUS, BUTTON_LONG_WIDTH, SPACING, FONT_LARGE, BUTTON_MODAL_TEXT, PLACEHOLDER_TEXT } from '../ui';
import { errorNoConfirm } from '../translations';
import UiStore from '../stores/UiStore';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
    }),
    inputBox: RX.Styles.createTextInputStyle({
        fontSize: FONT_LARGE,
        padding: SPACING,
        width: BUTTON_LONG_WIDTH,
        borderRadius: BORDER_RADIUS,
    }),
    textDialog: RX.Styles.createTextStyle({
        textAlign: 'center',
        color: BUTTON_MODAL_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
};

interface DialogNewCommunityProps {
    showRoom: (roomId: string) => void;
}

export default class DialogNewCommunity extends RX.Component<DialogNewCommunityProps, RX.Stateless> {

    private communityName = '';
    private alias = '';
    private topic = '';

    private createNewCommunity = () => {

        RX.Modal.dismissAll();

        RX.Modal.show(<ModalSpinner/>, 'modalspinner');

        ApiClient.createNewRoom('community', this.communityName, '', this.alias, this.topic)
            .then(response => {

                this.props.showRoom(response.room_id);

                RX.Modal.dismissAll();
            })
            .catch(_error => {

                RX.Modal.dismissAll();

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { errorNoConfirm[UiStore.getLanguage()] }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
            })
    }

    public render(): JSX.Element | null {

        const textInput = (
            <RX.View>

                <RX.TextInput
                    style={ styles.inputBox }
                    placeholder={ 'Community Name' }
                    placeholderTextColor={ PLACEHOLDER_TEXT }
                    onChangeText={ communityName => this.communityName = communityName }
                    disableFullscreenUI={ true }
                    autoCapitalize={ 'none' }
                    keyboardType={ 'default' }
                    autoCorrect={ false }
                />
                <RX.TextInput
                    style={ styles.inputBox }
                    placeholder={ 'Alias' }
                    placeholderTextColor={ PLACEHOLDER_TEXT }
                    onChangeText={ alias => this.alias = alias }
                    disableFullscreenUI={ true }
                    autoCapitalize={ 'none' }
                    keyboardType={ 'default' }
                    autoCorrect={ false }
                />
                <RX.TextInput
                    style={ styles.inputBox }
                    placeholder={ 'Topic' }
                    placeholderTextColor={ PLACEHOLDER_TEXT }
                    onChangeText={ topic => this.topic = topic }
                    disableFullscreenUI={ true }
                    autoCapitalize={ 'none' }
                    keyboardType={ 'default' }
                    autoCorrect={ false }
                />
            </RX.View>
        );

        const createCommunityDialog = (
            <DialogContainer
                content={ textInput }
                confirmButton={ true }
                confirmButtonText={ 'Create' }
                cancelButton={ true }
                cancelButtonText={ 'Cancel' }
                onConfirm={ this.createNewCommunity }
                onCancel={ () => RX.Modal.dismissAll() }
            />
        );

        return (
            <RX.View style={ styles.modalScreen }>
                { createCommunityDialog }
            </RX.View>
        );
    }
}
