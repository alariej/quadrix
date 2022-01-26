import React from 'react';
import { Modal } from 'react-native';
import RX from 'reactxp';
import AppFont from '../../modules/AppFont';
import UiStore from '../../stores/UiStore';
import { pleaseWait } from '../../translations';
import { BORDER_RADIUS, DIALOG_WIDTH, FONT_LARGE, MODAL_CONTENT_BACKGROUND, MODAL_CONTENT_TEXT, OPAQUE_BACKGROUND } from '../../ui';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf:'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: OPAQUE_BACKGROUND,
    }),
    contentContainer: RX.Styles.createViewStyle({
        flex: -1,
        width: DIALOG_WIDTH,
        backgroundColor: MODAL_CONTENT_BACKGROUND,
        borderRadius: BORDER_RADIUS,
    }),
    textDialog: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        textAlign: 'center',
        color: MODAL_CONTENT_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
}

interface ProgressDialogProps {
    text: string;
    value: number;
}

export default class ProgressDialog extends RX.Component<ProgressDialogProps, RX.Stateless> {

    public render(): JSX.Element | null {

        let text = '';
        if (!this.props.text || this.props.value === undefined) {
            text = pleaseWait[UiStore.getLanguage()];
        } else {
            text = this.props.text + Math.round(this.props.value * 100) + '%';
        }

        return (
            <Modal
                animationType={ 'none' }
                transparent={ true }
                visible={ true }
            >
                <RX.View style={ styles.container }>
                    <RX.View style={ styles.contentContainer }>
                        <RX.Text style={ styles.textDialog }>
                            { text }
                        </RX.Text>
                    </RX.View>
                </RX.View>
            </Modal>
        )
    }
}
