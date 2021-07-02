import React from 'react';
import RX from 'reactxp';
import { LOGO_BACKGROUND, OPAQUE_BACKGROUND } from '../ui';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        backgroundColor: OPAQUE_BACKGROUND,
        justifyContent: 'center',
    }),
    modalView: RX.Styles.createViewStyle({
        alignSelf: 'center',
    }),
};

export default class ModalSpinner extends RX.Component<unknown, RX.Stateless> {

    public render(): JSX.Element | null {

        return (
            <RX.View style={ styles.modalScreen }>
                <RX.View style={ styles.modalView }>
                    <RX.ActivityIndicator color={ LOGO_BACKGROUND } size={ 'large' } />
                </RX.View>
            </RX.View>
        );
    }
}
