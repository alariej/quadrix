import React from 'react';
import RX from 'reactxp';
import { APP_WEBSITE_URL, JITSI_SERVER_URL } from '../../appconfig';
import IconSvg, { SvgFile } from '../../components/IconSvg';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { JITSI_BORDER, PAGE_MARGIN, TRANSPARENT_BACKGROUND, OPAQUE_BACKGROUND, BUTTON_ROUND_WIDTH, SPACING, BUTTON_FILL,
    BORDER_RADIUS, BUTTON_JITSI_BACKGROUND, APP_BACKGROUND, TILE_HEIGHT } from '../../ui';
import UiStore from '../../stores/UiStore';

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
        backgroundColor: APP_BACKGROUND,
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

    private scale = 1;

    constructor(props: JitsiMeetProps) {
        super(props);

        this.scale = Math.min(1, Math.round(100 * (UiStore.getAppLayout_().screenWidth - 2 * PAGE_MARGIN) / 530) / 100);

        this.state = { isMinimized: false }
    }

    private onMessage = (message: WebViewMessageEvent) => {

        if (message.nativeEvent.data === 'HANGUP') {
            this.props.closeJitsiMeet();
        }
    }

    private setMinimized = (isMinimized: boolean) => {

        this.setState({ isMinimized: isMinimized });
    }

    public render(): JSX.Element | null {

        const url = APP_WEBSITE_URL;

        const html =
            `
            <!DOCTYPE html>
            <html style="height: 100%; width: 100%; margin: -8px">
                <head>
                    <meta charset="utf-8">
                    <meta http-equiv="content-type" content="text/html;charset=utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=${ this.scale }, maximum-scale=${ this.scale }">
                </head>
                <body style="height: 100%; width: 100%; display: flex; justify-content: center; align-items: center">

                    <script src="https://meet.jit.si/external_api.js"></script>
                    <script type="text/javascript">

                        var hangupListener;
                        const onHangup = () => {
                            window.ReactNativeWebView.postMessage("HANGUP");
                            api.removeEventListener("readyToClose", onHangup);
                            api.dispose();
                        };

                        const domain = "${ JITSI_SERVER_URL.replace('https://', '') }";
                        const options = {
                            roomName: "${ this.props.jitsiMeetId }",
                            height: '100%',
                            width: '100%',
                            parentNode: undefined,
                            interfaceConfigOverwrite: {
                                OPTIMAL_BROWSERS: [],
                                MOBILE_APP_PROMO: false,
                                TOOLBAR_ALWAYS_VISIBLE: true,
                                SHOW_JITSI_WATERMARK: false,
                                DISABLE_VIDEO_BACKGROUND: true,
                                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                                ENFORCE_NOTIFICATION_AUTO_DISMISS_TIMEOUT: 1,
                                RECENT_LIST_ENABLED: false,
                                DEFAULT_REMOTE_DISPLAY_NAME: '',
                                DEFAULT_LOCAL_DISPLAY_NAME: '',
                                TILE_VIEW_MAX_COLUMNS: 2,
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
                                            ideal: 240,
                                            max: 260,
                                            min: 220,
                                        },
                                        width: {
                                            ideal: 240,
                                            max: 260,
                                            min: 220,
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
                                disableResponsiveTiles: false,
                                toolbarButtons: [
                                    'microphone',
                                    'camera',
                                    'hangup',
                                    'tileview',
                                ]
                            },
                        };
                        var api = new JitsiMeetExternalAPI(domain, options);
                        hangupListener = api.addEventListeners({ 'readyToClose': onHangup });
                    </script>
                </body>
            </html>
            `;

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
                            fillColor={ BUTTON_FILL }
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

                    <WebView
                        scrollEnabled={ false }
                        originWhitelist={ ['*'] }
                        source={{
                            html: html,
                            baseUrl: `${url}`,
                        }}
                        onMessage={ this.onMessage }
                        mediaPlaybackRequiresUserAction={ false }
                        allowsInlineMediaPlayback={ true }
                    />

                    { buttonMinimize }

                </RX.View>

                { buttonMaximize }

            </RX.View>
        )
    }
}
