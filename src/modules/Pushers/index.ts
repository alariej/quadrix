import {
	APP_ID_LINUX,
	APP_ID_MACOS,
	APP_ID_WEB,
	APP_ID_WINDOWS,
	APP_NAME,
	APP_VERSION,
	PREFIX_REST,
	PUSH_GATEWAY_URL,
} from '../../appconfig';
import ApiClient from '../../matrix/ApiClient';
import RestClient from '../../matrix/RestClient';
import { Credentials } from '../../models/Credentials';
import { PusherParam_ } from '../../models/MatrixApi';
import UiStore from '../../stores/UiStore';
import Locale from '../Locale';
import StringUtils from '../../utils/StringUtils';

class Pushers {
	public async removeFromDevice(_credentials: Credentials): Promise<void> {
		return ApiClient.clearStoredPushToken();
	}

	private remove(credentials: Credentials, appId: string, token: string): Promise<void> {
		const restClient = new RestClient(credentials.accessToken, credentials.homeServer, PREFIX_REST);

		const pusher: PusherParam_ = {
			app_id: appId,
			kind: null,
			pushkey: token,
			data: {},
		};

		return restClient.setPusher(pusher);
	}

	public removeAll(credentials: Credentials): Promise<void> {
		const restClient = new RestClient(credentials.accessToken, credentials.homeServer, PREFIX_REST);

		return restClient.getPushers().then(response => {
			response.pushers.map((pusher: { app_id: string; pushkey: string }) => {
				this.remove(credentials, pusher.app_id, pusher.pushkey).catch(_error => null);
			});
		});
	}

	public async set(credentials: Credentials): Promise<void> {
		const language = UiStore.getLanguage();
		const locale = await Locale.getLocale().catch(_error => null);

		let pushToken = await ApiClient.getStoredPushToken().catch(_error => undefined);

		if (!pushToken) {
			pushToken = StringUtils.getRandomToken(36);
			await ApiClient.storePushToken(pushToken).catch(_error => undefined);
		}

		const restClient = new RestClient(credentials.accessToken, credentials.homeServer, PREFIX_REST);

		restClient
			.getPushers()
			.then(response => {
				let pusherIsOnServer = false;

				if (response.pushers && response.pushers.length > 0) {
					pusherIsOnServer = response.pushers.some(item => {
						const appVersion = item.data.client_version || '0.0.1';
						return (
							item.pushkey === pushToken &&
							appVersion === APP_VERSION &&
							item.data.url === PUSH_GATEWAY_URL
						);
					});
				}

				let appId: string;
				const desktopOS = UiStore.getDesktopOS();

				if (UiStore.getIsElectron()) {
					switch (desktopOS) {
						case 'Windows':
							appId = APP_ID_WINDOWS;
							break;

						case 'MacOS':
							appId = APP_ID_MACOS;
							break;

						default:
							appId = APP_ID_LINUX;
							break;
					}
				} else {
					appId = APP_ID_WEB;
				}

				if (!pusherIsOnServer) {
					const data = {
						format: 'event_id_only',
						url: PUSH_GATEWAY_URL,
						lang: language,
						locale: locale || 'unknown',
						client_version: APP_VERSION,
					};

					const pusher: PusherParam_ = {
						append: false,
						app_display_name: APP_NAME,
						app_id: appId,
						data: data,
						device_display_name: desktopOS,
						kind: 'http',
						lang: language,
						profile_tag: desktopOS,
						pushkey: pushToken!,
					};

					restClient.setPusher(pusher).catch(_error => null);
				}
			})
			.catch(_error => null);
	}
}

export default new Pushers();
