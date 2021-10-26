import React, { ReactElement } from 'react';
import RX from 'reactxp';
import Login from './views/Login';
import Main from './views/Main';
import ApiClient from './matrix/ApiClient';
import UiStore from './stores/UiStore';
import DataStore from './stores/DataStore';
import { ViewOnLayoutEvent } from 'reactxp/dist/common/Types';
import { ComponentBase } from 'resub';
import { APP_BACKGROUND } from './ui';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
    }),
};

interface AppState {
    startPage: ReactElement | undefined;
    backgroundColor: string;
}

interface AppProps {
    sharedContent?: string;
}

export class App extends ComponentBase<AppProps, AppState> {

    private sharedContent = '';
    private appColorSubscription: number;

    constructor(props: AppProps) {
        super(props);

        RX.UserInterface.useCustomScrollbars(true);
        RX.StatusBar.setTranslucent(false);
        RX.StatusBar.setBarStyle('light-content', true);
        RX.International.allowRTL(false);

        UiStore.setPlatform();
        UiStore.setDevice();
        UiStore.setIsElectron();
        UiStore.setLocale().catch(_error => null);

        if (UiStore.getPlatform() === 'web') {
            window.oncontextmenu = () => {
                return false;
            };
        }

        if (UiStore.getPlatform() === 'web' && UiStore.getIsElectron()) {

            const { webFrame } = window.require('electron');

            ApiClient.getStoredZoomFactor()
                .then(zoomFactor => {
                    webFrame.setZoomFactor(Math.round((zoomFactor || 1) * 100) / 100);
                })
                .catch(_error => null);
        }

        this.appColorSubscription = UiStore.subscribe(this.changeAppColor, UiStore.ColorTrigger);
        this.sharedContent = props.sharedContent || '';
    }

    private changeAppColor = () => {

        const appColor = UiStore.getAppColor();
        this.setState({ backgroundColor: appColor });
        RX.StatusBar.setBackgroundColor(appColor, true);
    }

    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const backgroundColor = await UiStore.getAppColorFromStorage() || APP_BACKGROUND[0];
        this.setState({ backgroundColor: backgroundColor });
        UiStore.setAppColor(backgroundColor);
        RX.StatusBar.setBackgroundColor(backgroundColor, true);

        const credentials = await ApiClient.getStoredCredentials();
        credentials ? this.showMain() : this.showLogin();

        if (UiStore.getIsElectron()) {

            const { ipcRenderer } = window.require('electron');

            const storeElectronData = () => {
                ApiClient.storeAppData()
                    .then(_response => {
                        ipcRenderer.removeListener('storeDataAndCloseApp', storeElectronData);
                        ipcRenderer.send('closeApp');
                    })
                    .catch(_error => null);
            }

            ipcRenderer.on('storeDataAndCloseApp', storeElectronData);
        }
    }

    public componentWillUnmount(): void {
        super.componentWillUnmount();

        UiStore.unsubscribe(this.appColorSubscription);
    }

    private showLogin = () => {

        ApiClient.stopSync();
        ApiClient.clearNextSyncToken();
        DataStore.clearRoomSummaryList();

        const loginPage = (
            <Login
                showMainPage={ this.showMain }
            />
        );

        this.setState({ startPage: loginPage });
    }

    private showMain = () => {

        const mainPage = (
            <Main
                showLogin={ this.showLogin }
                sharedContent={ this.sharedContent }
            />
        );

        this.sharedContent = '';

        this.setState({ startPage: mainPage });
    }

    private setLayout = (layout: ViewOnLayoutEvent) => {

        UiStore.setAppLayout(layout);
    }

    public render(): JSX.Element | null {

        if (!this.state.startPage) { return null }

        return (
            <RX.View
                style={[styles.container, { backgroundColor: this.state.backgroundColor }]}
                onLayout={ this.setLayout }
                useSafeInsets={ true }
            >
                { this.state.startPage }
            </RX.View>
        );
    }
}
