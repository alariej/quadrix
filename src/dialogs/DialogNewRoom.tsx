import React from 'react';
import RX from 'reactxp';
import DialogNewGroup from './DialogNewGroup';
import DialogNewNotepad from './DialogNewNotepad';
import DialogNewDirectConversation from './DialogNewDirectConversation';
import DialogJoinCommunity from './DialogJoinCommunity';
import { BUTTON_MODAL_BACKGROUND, BUTTON_MODAL_TEXT, OPAQUE_BACKGROUND, BORDER_RADIUS, DIALOG_WIDTH, SPACING,
    AVATAR_SMALL_WIDTH, TILE_HEIGHT, FONT_LARGE, AVATAR_MARGIN } from '../ui';
import UiStore from '../stores/UiStore';
import { createNewConv, createNewGroup, joinPublicComm, createNewNote } from '../translations';
import IconSvg, { SvgFile } from '../components/IconSvg';

const styles = {
    containerButtons: RX.Styles.createViewStyle({
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    }),
    containerButton: RX.Styles.createViewStyle({
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS,
        width: DIALOG_WIDTH,
        height: TILE_HEIGHT,
        backgroundColor: BUTTON_MODAL_BACKGROUND,
        padding: SPACING,
        marginBottom: SPACING,
        cursor: 'pointer',
    }),
    buttonText: RX.Styles.createTextStyle({
        flex: 1,
        fontSize: FONT_LARGE,
        color: BUTTON_MODAL_TEXT,
        paddingRight: SPACING,
    }),
    modalScreen: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        backgroundColor: OPAQUE_BACKGROUND,
        justifyContent: 'center',
    }),
    containerAvatar: RX.Styles.createViewStyle({
        justifyContent: 'center',
        alignItems: 'center',
        height: AVATAR_SMALL_WIDTH,
        width: AVATAR_SMALL_WIDTH,
        borderRadius: AVATAR_SMALL_WIDTH / 2,
        marginRight: AVATAR_MARGIN,
    }),
};

interface DialogNewRoomProps {
    showRoom: (roomId: string) => void;
}

export default class DialogNewRoom extends RX.Component<DialogNewRoomProps, RX.Stateless> {

    private startNewConversation = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        RX.Modal.dismiss('buttonrender');

        RX.Modal.show(<DialogNewDirectConversation showRoom={ this.props.showRoom }/>, 'createdirectdialog');
    }

    private createNewGroup = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        RX.Modal.dismiss('buttonrender');

        RX.Modal.show(<DialogNewGroup showRoom={ this.props.showRoom }/>, 'creategroupdialog');
    }

    private joinCommunity = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        RX.Modal.dismiss('buttonrender');

        RX.Modal.show(<DialogJoinCommunity showRoom={ this.props.showRoom }/>, 'modaldialog_searchcommunity');
    }

    private createNewNotepad = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        RX.Modal.dismiss('buttonrender');

        RX.Modal.show(<DialogNewNotepad showRoom={ this.props.showRoom }/>, 'createnotepaddialog');
    }

    public render(): JSX.Element | null {

        const language = UiStore.getLanguage();

        return (
            <RX.View
                style={ styles.modalScreen }
                onPress={() => RX.Modal.dismissAll() }
                disableTouchOpacityAnimation={ true }
            >
                <RX.View
                    style={ styles.containerButtons }
                    onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    <RX.View
                        style={ styles.containerButton }
                        onPress={ event => this.startNewConversation(event) }
                        disableTouchOpacityAnimation={ false }
                        activeOpacity={ 0.8 }
                    >
                        <RX.View style={ styles.containerAvatar }>
                            <IconSvg
                                source= { require('../resources/svg/contact.json') as SvgFile }
                                fillColor={ BUTTON_MODAL_TEXT }
                                height={ AVATAR_SMALL_WIDTH * 0.5 }
                                width={ AVATAR_SMALL_WIDTH * 0.5 }
                            />
                        </RX.View>
                        <RX.Text style={ styles.buttonText }>
                            { createNewConv[language] }
                        </RX.Text>
                    </RX.View>
                    <RX.View
                        style={ styles.containerButton }
                        onPress={ event => this.createNewGroup(event) }
                        disableTouchOpacityAnimation={ false }
                        activeOpacity={ 0.8 }
                    >
                        <RX.View style={ styles.containerAvatar }>
                            <IconSvg
                                source= { require('../resources/svg/group.json') as SvgFile }
                                fillColor={ BUTTON_MODAL_TEXT }
                                height={ AVATAR_SMALL_WIDTH * 0.7 }
                                width={ AVATAR_SMALL_WIDTH * 0.7 }
                            />
                        </RX.View>
                        <RX.Text style={ styles.buttonText }>
                            { createNewGroup[language] }
                        </RX.Text>
                    </RX.View>
                    <RX.View
                        style={ styles.containerButton }
                        onPress={ event => this.joinCommunity(event) }
                        disableTouchOpacityAnimation={ false }
                        activeOpacity={ 0.8 }
                    >
                        <RX.View style={ styles.containerAvatar }>
                            <IconSvg
                                source= { require('../resources/svg/community.json') as SvgFile }
                                fillColor={ BUTTON_MODAL_TEXT }
                                height={ AVATAR_SMALL_WIDTH * 0.6 }
                                width={ AVATAR_SMALL_WIDTH * 0.6 }
                            />
                        </RX.View>
                        <RX.Text style={ styles.buttonText }>
                            { joinPublicComm[language] }
                        </RX.Text>
                    </RX.View>
                    <RX.View
                        style={ styles.containerButton }
                        onPress={ event => this.createNewNotepad(event) }
                        disableTouchOpacityAnimation={ false }
                        activeOpacity={ 0.8 }
                    >
                        <RX.View style={ styles.containerAvatar }>
                            <IconSvg
                                source= { require('../resources/svg/notepad.json') as SvgFile }
                                fillColor={ BUTTON_MODAL_TEXT }
                                height={ AVATAR_SMALL_WIDTH * 0.6 }
                                width={ AVATAR_SMALL_WIDTH * 0.6 }
                                style={{ marginLeft: AVATAR_SMALL_WIDTH / 14, marginBottom: AVATAR_SMALL_WIDTH / 14 }}
                            />
                        </RX.View>
                        <RX.Text style={ styles.buttonText }>
                            { createNewNote[language] }
                        </RX.Text>
                    </RX.View>
                </RX.View>
            </RX.View>
        );
    }
}
