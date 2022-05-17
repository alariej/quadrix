import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { OPAQUE_BACKGROUND } from '../../ui';
import { KeyboardAvoidingView } from 'react-native';
import UiStore from '../../stores/UiStore';

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
                <KeyboardAvoidingView
                    style={{
                        flex: 1,
                        alignItems: 'center',
                    }}
                    behavior={ UiStore.getPlatform() === 'ios' ? 'padding' : undefined }
                >
                    { this.props.content }
                </KeyboardAvoidingView>
            </RX.View>
        );
    }
}
