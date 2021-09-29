import React from 'react';
import RX from 'reactxp';
import { JITSI_SERVER_URL } from '../../appconfig';
import IconSvg, { SvgFile } from '../../components/IconSvg';
import { JITSI_BORDER, PAGE_MARGIN, TRANSPARENT_BACKGROUND, OPAQUE_BACKGROUND, BUTTON_ROUND_WIDTH, SPACING, LOGO_BACKGROUND,
    BORDER_RADIUS, BUTTON_JITSI_BACKGROUND, APP_BACKGROUND, TILE_HEIGHT } from '../../ui';

const styles = {
    container: RX.Styles.createViewStyle({
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: OPAQUE_BACKGROUND,
        alignItems: 'center',
        justifyContent: 'center',
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
    isLoaded: boolean;
}

export default class JitsiMeet extends RX.Component<JitsiMeetProps, JitsiMeetState> {

    private scriptElement: HTMLScriptElement;
    // @ts-ignore
    private jitsiApi;

    constructor(props: JitsiMeetProps) {
        super(props);

        this.scriptElement = document.createElement('script');
        this.scriptElement.id = 'jitsiapi';
        this.scriptElement.async = true;
        this.scriptElement.defer = true;
        this.scriptElement.src = 'https://meet.jit.si/external_api.js';

        this.scriptElement.onload = () => {
            this.startJitsiMeet();
        };

        this.state = {
            isMinimized: false,
            isLoaded: false,
        }
    }

    private startJitsiMeet = () => {

        RX.Modal.dismiss('modalspinnerjitsi');

        const domain = JITSI_SERVER_URL.replace('https://', '');
        const options = {
            roomName: this.props.jitsiMeetId,
            height: '100%',
            width: '100%',
            parentNode: document.getElementById('jitsicomponent'),
            interfaceConfigOverwrite: {
                OPTIMAL_BROWSERS: ['chromium'],
                MOBILE_APP_PROMO: false,
                TOOLBAR_ALWAYS_VISIBLE: true,
                SHOW_JITSI_WATERMARK: false,
                DISABLE_VIDEO_BACKGROUND: true,
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                ENFORCE_NOTIFICATION_AUTO_DISMISS_TIMEOUT: 1,
                RECENT_LIST_ENABLED: false,
                DEFAULT_REMOTE_DISPLAY_NAME: '',
                DEFAULT_LOCAL_DISPLAY_NAME: '',
                TILE_VIEW_MAX_COLUMNS: 3,
                VERTICAL_FILMSTRIP: true,
                FILM_STRIP_MAX_HEIGHT: 150,
                LOCAL_THUMBNAIL_RATIO: 1,
                REMOTE_THUMBNAIL_RATIO: 1,
                VIDEO_LAYOUT_FIT: 'height',
                MAXIMUM_ZOOMING_COEFFICIENT: 1,
                VIDEO_QUALITY_LABEL_DISABLED: true,
                SHOW_CHROME_EXTENSION_BANNER: false,
                SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            },
            configOverwrite: {
                startAudioOnly: false,
                constraints: {
                    video: {
                        height: {
                            ideal: 540,
                            max: 720,
                            min: 240,
                        },
                        width: {
                            ideal: 540,
                            max: 720,
                            min: 240,
                        },
                        frameRate: {
                            ideal: 10,
                            max: 15,
                            min: 5,
                        },
                        aspectRatio: 1,
                        facingMode: { exact: 'user' },
                    },
                },
                disableSimulcast: true,
                localRecording: { enabled: false },
                p2p: { enabled: false }, // 'true' crashes chromium + electron
                disableH264: true,
                enableLayerSuspension: true,
                prejoinPageEnabled: false,
                defaultLanguage: 'en',
                disableThirdPartyRequests: true,
                disableDeepLinking: true,
                enableNoAudioDetection: false,
                enableNoisyMicDetection: false,
                requireDisplayName: false,
                enableWelcomePage: false,
                hideConferenceSubject: true,
                hideConferenceTimer: true,
                disable1On1Mode: true,
                disableFilmstripAutohiding: true,
                maxFullResolutionParticipants: 1,
                disableResponsiveTiles: true,
                toolbarButtons: [
                    'microphone',
                    'camera',
                    'hangup',
                    'tileview',
                    'fullscreen',
                ]
            },
        };

        // @ts-ignore
        this.jitsiApi = new JitsiMeetExternalAPI(domain, options); // eslint-disable-line

        this.jitsiApi.addEventListeners({ 'readyToClose': this.closeJitsiMeet }); // eslint-disable-line

        this.setState({ isLoaded: true });
    }

    private closeJitsiMeet = () => {

        this.jitsiApi.removeEventListener('readyToClose', this.closeJitsiMeet); // eslint-disable-line

        document.body.removeChild(this.scriptElement);

        this.props.closeJitsiMeet();
    }

    private setMinimized = (isMinimized: boolean) => {

        this.setState({ isMinimized: isMinimized });
    }

    public render(): JSX.Element | null {

        if (!this.state.isLoaded) {
            document.body.appendChild(this.scriptElement);
        }

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

                    <div style={{ flex: 1 }} id={ 'jitsicomponent' }/>

                    { buttonMinimize }

                </RX.View>

                { buttonMaximize }

            </RX.View>
        )
    }
}
