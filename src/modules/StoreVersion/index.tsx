import React, { ReactElement } from 'react';
import RX from 'reactxp';
import axios from 'axios';
import semver from 'semver';
import { APPSTORES_INFO_URL, APP_VERSION } from '../../appconfig';
import UiStore from '../../stores/UiStore';
import { newVersion } from '../../translations';
import { FONT_LARGE, FONT_NORMAL, INPUT_TEXT, LINK_TEXT, OBJECT_MARGIN } from '../../ui';
import AppFont from '../AppFont';
import DialogContainer from '../DialogContainer';

const styles = {
	textDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		color: INPUT_TEXT,
		fontSize: FONT_LARGE,
		margin: 12,
	}),
	link: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: LINK_TEXT,
		textDecorationLine: 'underline',
		textAlign: 'center',
		wordBreak: 'break-all',
		paddingHorizontal: OBJECT_MARGIN,
		marginVertical: 12,
	}),
};

declare interface NavigatorUA extends Navigator {
	readonly userAgentData?: NavigatorUAData;
}

interface NavigatorUAData extends UALowEntropyJSON {
	getHighEntropyValues(hints: string[]): Promise<UADataValues>;
	toJSON(): UALowEntropyJSON;
}

interface UALowEntropyJSON {
	readonly brands: NavigatorUABrandVersion[];
	readonly mobile: boolean;
	readonly platform: string;
}

interface NavigatorUABrandVersion {
	readonly brand: string;
	readonly version: string;
}

interface UADataValues {
	readonly brands?: NavigatorUABrandVersion[];
	readonly mobile?: boolean;
	readonly platform?: string;
	readonly architecture?: string;
	readonly bitness?: string;
	readonly model?: string;
	readonly platformVersion?: string;
	readonly uaFullVersion?: string;
	readonly fullVersionList?: NavigatorUABrandVersion[];
	readonly wow64?: boolean;
}

interface StoresData {
	googleplay: { version: string; url: string };
	appstore: { version: string; url: string };
	macappstore: { version: string; url: string };
	microsoft: { version: string; url: string };
	snapstore: { version: { amd64: string; arm64: string; armhf: string }; url: string };
	flathub: { version: { amd64: string; arm64: string }; url: string };
}

export class StoreVersion {
	private storeVersion = '';
	private storeUrl: ReactElement | undefined;

	private openUrl = (url: string, event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		const { shell } = window.require('electron');
		shell.openExternal(url).catch(_error => null);
	};

	public check = async (): Promise<boolean> => {
		const navigator_ = navigator as NavigatorUA;

		const userAgentData = await navigator_
			.userAgentData!.getHighEntropyValues(['platform', 'architecture', 'bitness', 'mobile'])
			.catch();

		// platform: Linux, Windows, macOS
		// architecture: ARM (or arm?), x86
		// bitness: 64, 32
		// mobile: true, false

		const storesUrl = APPSTORES_INFO_URL;

		const storesData_ = await axios
			.request({
				url: storesUrl,
				method: 'GET',
			})
			.catch();

		const storesData = storesData_.data as StoresData;

		switch (userAgentData.platform?.toLowerCase()) {
			case 'linux':
				this.storeVersion = storesData.snapstore.version.amd64;
				this.storeUrl = (
					<RX.View>
						<RX.Text
							style={styles.link}
							onPress={event => this.openUrl(storesData.snapstore.url, event)}
						>
							{storesData.snapstore.url}
						</RX.Text>
						<RX.Text
							style={styles.link}
							onPress={event => this.openUrl(storesData.flathub.url, event)}
						>
							{storesData.flathub.url}
						</RX.Text>
					</RX.View>
				);
				break;

			case 'windows':
				this.storeVersion = storesData.microsoft.version;
				this.storeUrl = (
					<RX.View>
						<RX.Text
							style={styles.link}
							onPress={event => this.openUrl(storesData.microsoft.url, event)}
						>
							{storesData.microsoft.url}
						</RX.Text>
					</RX.View>
				);
				break;

			case 'macos':
				this.storeVersion = storesData.macappstore.version;
				this.storeUrl = (
					<RX.View>
						<RX.Text
							style={styles.link}
							onPress={event => this.openUrl(storesData.macappstore.url, event)}
						>
							{storesData.macappstore.url}
						</RX.Text>
					</RX.View>
				);
				break;
		}

		return Promise.resolve(semver.lt(APP_VERSION, this.storeVersion));
	};

	public showDialog = () => {
		const text = (
			<RX.View>
				<RX.Text style={styles.textDialog}>
					{newVersion(APP_VERSION, this.storeVersion, UiStore.getLanguage())}
				</RX.Text>
				{this.storeUrl}
			</RX.View>
		);

		RX.Modal.show(<DialogContainer content={text} />, 'new_version_dialog');
	};
}

export default new StoreVersion();
