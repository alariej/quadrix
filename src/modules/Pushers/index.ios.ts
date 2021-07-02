import messaging from '@react-native-firebase/messaging';
import RestClient from '../../matrix/RestClient';
import { Credentials } from '../../models/Credentials';
import { PusherParam_ } from '../../models/MatrixApi';
import { PUSH_GATEWAY_URL, APP_NAME, APP_ID_IOS, PREFIX_REST } from '../../appconfig';
import UiStore from '../../stores/UiStore';

class Pushers {

    public remove(credentials: Credentials, appId: string, token: string): Promise<void> {

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

        return restClient.getPushers()
            .then(response => {

                response.pushers.map((pusher: { app_id: string; pushkey: string; }) => {
                    this.remove(credentials, pusher.app_id, pusher.pushkey).catch(_error => null);
                });
            });
    }

    public async set(credentials: Credentials): Promise<void> {

        const messagingPermission = await messaging().requestPermission().catch(_error => null);

        const enabled =
            messagingPermission === messaging.AuthorizationStatus.AUTHORIZED ||
            messagingPermission === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) { return }

        const firebaseToken = await messaging().getToken().catch(_error => null);

        if (!firebaseToken) { return }

        const restClient = new RestClient(credentials.accessToken, credentials.homeServer, PREFIX_REST);

        restClient.getPushers()
            .then(response => {

                let pusherIsOnServer = false;

                if (response.pushers && response.pushers.length > 0) {

                    pusherIsOnServer = response.pushers.some(item => {
                        return item.pushkey === firebaseToken;
                    });
                }

                if (!pusherIsOnServer) {

                    const language = UiStore.getLanguage();

                    const data = {
                        format: 'event_id_only',
                        url: PUSH_GATEWAY_URL,
                        lang: language,
                        sound: 'ding.wav',
                    };

                    const pusher: PusherParam_ = {
                        append: false,
                        app_display_name: APP_NAME,
                        app_id: APP_ID_IOS,
                        data: data,
                        device_display_name: 'iPhone', // not used in sygnode
                        kind: 'http',
                        lang: language,
                        profile_tag: 'iPhone', // not used in sygnode
                        pushkey: firebaseToken,
                    };

                    restClient.setPusher(pusher).catch(_error => null);
                }
            })
            .catch(_error => null);
    }
}

export default new Pushers();
