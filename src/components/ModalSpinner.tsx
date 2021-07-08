import React from 'react';
import RX from 'reactxp';
import { LOGO_BACKGROUND, OPAQUE_BACKGROUND } from '../ui';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        justifyContent: 'center',
    }),
    modalView: RX.Styles.createViewStyle({
        alignSelf: 'center',
    }),
};

interface SpinnerProps {
    backgroundColor?: string;
}

export default class ModalSpinner extends RX.Component<SpinnerProps, RX.Stateless> {

    public render(): JSX.Element | null {

        return (
            <RX.View style={[styles.modalScreen, { backgroundColor: this.props.backgroundColor || OPAQUE_BACKGROUND }]}>
                <RX.View style={ styles.modalView }>
                    <RX.ActivityIndicator color={ LOGO_BACKGROUND } size={ 'large' } />
                </RX.View>
            </RX.View>
        );
    }
}
