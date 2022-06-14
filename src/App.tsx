import React, { ReactElement } from 'react';
import RX from 'reactxp';
import Login from './views/Login';
import Main from './views/Main';
import ApiClient from './matrix/ApiClient';
import UiStore from './stores/UiStore';
import DataStore from './stores/DataStore';
import { ViewOnLayoutEvent } from 'reactxp/dist/common/Types';
import { ComponentBase } from 'resub';
import { APP_BACKGROUND, STATUSBAR_BACKGROUND } from './ui';
import FileHandler from './modules/FileHandler';
import RXNetInfo from 'reactxp-netinfo';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		backgroundColor: APP_BACKGROUND,
	}),
};

interface AppState {
	startPage: ReactElement | undefined;
}

interface AppProps {
	sharedContent?: string;
}

export class App extends ComponentBase<AppProps, AppState> {
	private sharedContent = '';

	constructor(props: AppProps) {
		super(props);

		RXNetInfo.isConnected()
			.then(response => {
				UiStore.setOffline(!response);
			})
			.catch(_error => null);

		RX.UserInterface.useCustomScrollbars(true);
		RX.International.allowRTL(false);

		UiStore.setPlatform();
		UiStore.setDevice();
		UiStore.setIsElectron();
		UiStore.setLocale().catch(_error => null);

		if (UiStore.getPlatform() === 'web' && !UiStore.getIsElectron()) {
			window.oncontextmenu = () => {
				return false;
			};
		}

		if (UiStore.getIsElectron()) {
			const { webFrame } = window.require('electron');

			ApiClient.getStoredZoomFactor()
				.then(zoomFactor => {
					webFrame.setZoomFactor(Math.round((zoomFactor || 1) * 100) / 100);
				})
				.catch(_error => null);
		}

		this.sharedContent = props.sharedContent || '';

		if (UiStore.getIsElectron() || ['android', 'ios'].includes(UiStore.getPlatform())) {
			FileHandler.setCacheAppFolder();
		}
	}

	public async componentDidMount(): Promise<void> {
		super.componentDidMount();

		RX.StatusBar.setBackgroundColor(STATUSBAR_BACKGROUND, true);
		RX.StatusBar.setBarStyle('dark-content', true);

		const credentials = await ApiClient.getStoredCredentials();
		credentials ? this.showMain() : this.showLogin();

		RXNetInfo.connectivityChangedEvent.subscribe(isConnected => {
			UiStore.setOffline(!isConnected);
		});

		if (UiStore.getIsElectron()) {
			const { ipcRenderer } = window.require('electron');

			const storeElectronData = () => {
				ApiClient.storeAppData()
					.then(_response => {
						ipcRenderer.removeListener('storeDataAndCloseApp', storeElectronData);
						ipcRenderer.send('closeApp');
					})
					.catch(_error => null);
			};

			ipcRenderer.on('storeDataAndCloseApp', storeElectronData);
		}
	}

	public componentWillUnmount(): void {
		super.componentWillUnmount();

		RXNetInfo.connectivityChangedEvent.unsubscribe(_isConnected => null);
	}

	private showLogin = () => {
		ApiClient.stopSync();
		ApiClient.clearNextSyncToken();
		DataStore.clearRoomSummaryList();

		const loginPage = <Login showMainPage={this.showMain} />;

		this.setState({ startPage: loginPage });
	};

	private showMain = () => {
		const mainPage = (
			<Main
				showLogin={this.showLogin}
				sharedContent={this.sharedContent}
			/>
		);

		this.sharedContent = '';

		this.setState({ startPage: mainPage });
	};

	private setLayout = (layout: ViewOnLayoutEvent) => {
		UiStore.setAppLayout(layout);
	};

	public render(): JSX.Element | null {
		if (!this.state.startPage) {
			return null;
		}

		return (
			<RX.View
				style={styles.container}
				onLayout={this.setLayout}
				useSafeInsets={true}
			>
				{this.state.startPage}
			</RX.View>
		);
	}
}
