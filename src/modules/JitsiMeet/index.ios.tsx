import React from 'react';
import RX from 'reactxp';
import { JITSI_SERVER_URL } from '../../appconfig';
import { JITSI_BORDER, BUTTON_JITSI_BACKGROUND, PAGE_MARGIN, TRANSPARENT_BACKGROUND, OPAQUE_BACKGROUND, BUTTON_ROUND_WIDTH,
    SPACING, LOGO_BACKGROUND, BORDER_RADIUS, APP_BACKGROUND, TILE_HEIGHT } from '../../ui';
import IconSvg, { SvgFile } from '../../components/IconSvg';
import { JitsiMeetOptions } from '../../modulesNative/JitsiMeet';
import ApiClient from '../../matrix/ApiClient';

const styles = {
    container: RX.Styles.createViewStyle({
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: OPAQUE_BACKGROUND,
    }),
    containerMinimized: RX.Styles.createViewStyle({
        position: 'absolute',
        bottom: PAGE_MARGIN + SPACING,
        right: PAGE_MARGIN + SPACING,
        width: 80,
        height: 100,
        backgroundColor: TRANSPARENT_BACKGROUND,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS,
        borderWidth: 1,
        borderColor: JITSI_BORDER,
        overflow: 'hidden',
    }),
    jitsiContainer: RX.Styles.createViewStyle({
        flex: 1,
        alignSelf: 'stretch',
        marginHorizontal: PAGE_MARGIN,
        marginVertical: TILE_HEIGHT,
        borderRadius: BORDER_RADIUS,
        borderWidth: 1,
        borderColor: JITSI_BORDER,
        overflow: 'hidden',
        backgroundColor: APP_BACKGROUND[0],
    }),
    jitsiContainerMinimized: RX.Styles.createViewStyle({
        width: 80,
        height: 100,
    }),
    buttonMinimize: RX.Styles.createViewStyle({
        position: 'absolute',
        left: 2 * SPACING,
        top: 2 * SPACING,
        width: BUTTON_ROUND_WIDTH,
        height: BUTTON_ROUND_WIDTH,
    }),
    buttonMaximize: RX.Styles.createViewStyle({
        position: 'absolute',
        width: 80,
        height: 100,
        backgroundColor: BUTTON_JITSI_BACKGROUND,
    }),
    containerIcon: RX.Styles.createViewStyle({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }),
}

interface JitsiMeetProps {
    jitsiMeetId: string;
    closeJitsiMeet: () => void;
}

interface JitsiMeetState {
    isMinimized: boolean;
}

export default class JitsiMeet extends RX.Component<JitsiMeetProps, JitsiMeetState> {

    private options: JitsiMeetOptions;

    constructor(props: JitsiMeetProps) {
        super(props);

        this.state = { isMinimized: false }

        this.options = {
            room: props.jitsiMeetId,
            serverUrl: JITSI_SERVER_URL,
            userInfo: {
                displayName: ApiClient.credentials.userId,
            },
            featureFlags: {
                'add-people.enabled': false,
                'calendar.enabled': false,
                'call-integration.enabled': true,
                'chat.enabled': false,
                'conference-timer.enabled': false,
                'filmstrip.enabled': true,
                'fullscreen.enabled': false,
                'invite.enabled': false,
                'meeting-name.enabled': false,
                'notifications.enabled': false,
                'overflow-menu.enabled': false,
                'pip.enabled': false,
                'tile-view.enabled': false,
                'toolbox.alwaysVisible': true,
                'resolution': 240,
            }
        }
    }

    private setMinimized = (isMinimized: boolean) => {

        this.setState({ isMinimized: isMinimized });
    }

    private onConferenceTerminated = () => {

        this.props.closeJitsiMeet();
    }

    private onConferenceJoined = () => {
        // not used yet
    }

    public render(): JSX.Element | null {

        let buttonMinimize;
        let buttonMaximize;

        if (this.state.isMinimized) {

            buttonMinimize = null;

            buttonMaximize = (
                <RX.Button
                    style={ styles.buttonMaximize }
                    onPress={ () => this.setMinimized(false) }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                </RX.Button>
            );

        } else {

            buttonMaximize = null;

            buttonMinimize = (
                <RX.Button
                    style={ styles.buttonMinimize }
                    onPress={ () => this.setMinimized(true) }
                    disableTouchOpacityAnimation={ true }
                    activeOpacity={ 1 }
                >
                    <RX.View style={ styles.containerIcon }>
                        <IconSvg
                            source= { require('../../resources/svg/arrow_down.json') as SvgFile }
                            fillColor={ LOGO_BACKGROUND }
                            height={ 16 }
                            width={ 16 }
                        />
                    </RX.View>
                </RX.Button>
            );
        }

        return (
            <RX.View style={ this.state.isMinimized ? styles.containerMinimized : styles.container }>
                <RX.View style={ this.state.isMinimized ? styles.jitsiContainerMinimized : styles.jitsiContainer }>
                    {/* 
                    <RCTJitsiMeet.View
                        style={{ flex: 1, margin: -1 }}
                        options={ this.options }
                        onConferenceTerminated={ this.onConferenceTerminated }
                        onConferenceJoined={ this.onConferenceJoined }
                        onClick={ e => console.log(e) } // to test propagating touches from jitsimeetsdk
                    />
                    */}
                    { buttonMinimize }
                </RX.View>
                { buttonMaximize }
            </RX.View>
        )
    }
}
