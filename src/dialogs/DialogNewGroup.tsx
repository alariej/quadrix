import React from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import ModalSpinner from '../components/ModalSpinner';
import DialogContainer from '../modules/DialogContainer';
import { BORDER_RADIUS, FONT_LARGE, BUTTON_MODAL_TEXT, CONTAINER_PADDING, BUTTON_HEIGHT, PLACEHOLDER_TEXT } from '../ui';
import { createGroup, cancel, groupName, errorNoConfirm, Languages } from '../translations';
import UiStore from '../stores/UiStore';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
    }),
    inputBox: RX.Styles.createTextInputStyle({
        fontSize: FONT_LARGE,
        paddingHorizontal: CONTAINER_PADDING,
        height: BUTTON_HEIGHT,
        borderRadius: BORDER_RADIUS,
        alignSelf: 'stretch',
    }),
    textDialog: RX.Styles.createTextStyle({
        textAlign: 'center',
        color: BUTTON_MODAL_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
};

interface DialogNewGroupProps {
    showRoom: (roomId: string) => void;
}

export default class DialogNewGroup extends RX.Component<DialogNewGroupProps, RX.Stateless> {

    private groupName = '';
    private language: Languages = 'en';

    constructor(props: DialogNewGroupProps) {
        super(props);

        this.language = UiStore.getLanguage();
    }

    private createNewGroup = () => {

        if (!this.groupName) { return; }

        RX.Modal.dismissAll();

        RX.Modal.show(<ModalSpinner/>, 'modalspinner');

        ApiClient.createNewRoom('group', this.groupName)
            .then(response => {

                this.props.showRoom(response.room_id);

                RX.Modal.dismissAll();
            })
            .catch(_error => {

                RX.Modal.dismissAll();

                const text = (
                    <RX.Text style={ styles.textDialog }>
                        { errorNoConfirm[this.language] }
                    </RX.Text>
                );

                RX.Modal.show(<DialogContainer content={ text } modalId={ 'errordialog' }/>, 'errordialog');
            })
    }

    public render(): JSX.Element | null {

        const textInput = (
            <RX.TextInput
                style={ styles.inputBox }
                placeholder={ groupName[this.language] }
                placeholderTextColor={ PLACEHOLDER_TEXT }
                onChangeText={ groupName => this.groupName = groupName }
                keyboardType={ 'default' }
                disableFullscreenUI={ true }
                allowFontScaling={ false }
                autoCapitalize={ 'sentences' }
                autoCorrect={ false }
                autoFocus={ true }
                spellCheck={ false }
            />
        );

        const createGroupDialog = (
            <DialogContainer
                content={ textInput }
                confirmButton={ true }
                confirmButtonText={ createGroup[this.language] }
                cancelButton={ true }
                cancelButtonText={ cancel[this.language] }
                onConfirm={ this.createNewGroup }
                onCancel={ () => RX.Modal.dismissAll() }
            />
        );

        return (
            <RX.View style={ styles.modalScreen }>
                { createGroupDialog }
            </RX.View>
        );
    }
}
