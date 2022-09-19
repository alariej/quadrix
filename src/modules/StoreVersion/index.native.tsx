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

		RX.Linking.openUrl(url).catch(_error => null);
	};

	public check = async (): Promise<boolean> => {
		const storesUrl = APPSTORES_INFO_URL;

		const storesData_ = await axios
			.request({
				url: storesUrl,
				method: 'GET',
			})
			.catch();
			
		const storesData = storesData_.data as StoresData;

		switch (UiStore.getPlatform()) {
			case 'android':
				this.storeVersion = storesData.googleplay.version;
				this.storeUrl = (
					<RX.View>
						<RX.Text
							style={styles.link}
							onPress={event => this.openUrl(storesData.googleplay.url, event)}
						>
							{storesData.googleplay.url}
						</RX.Text>
					</RX.View>
				);
				break;

			case 'ios':
				this.storeVersion = storesData.appstore.version;
				this.storeUrl = (
					<RX.View>
						<RX.Text
							style={styles.link}
							onPress={event => this.openUrl(storesData.appstore.url, event)}
						>
							{storesData.appstore.url}
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
