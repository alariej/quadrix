import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { OPAQUE_BACKGROUND } from '../../ui';

const styles = {
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        backgroundColor: OPAQUE_BACKGROUND
    }),
};

interface KeyboardAwareViewProps {
    content: ReactElement;
}

export default class KeyboardAwareView extends RX.Component<KeyboardAwareViewProps, RX.Stateless> {

    public render(): JSX.Element | null {

        return (
            <RX.View
                style={ styles.modalScreen }
                onPress={ () => RX.UserInterface.dismissKeyboard() }
                disableTouchOpacityAnimation={ true }
                activeOpacity={ 1 }
            >
                <RX.View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                    }}
                >
                    { this.props.content }
                </RX.View>
            </RX.View>
        );
    }
}
