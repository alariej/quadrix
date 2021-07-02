import { PREFIX_REST } from '../../appconfig';
import RestClient from '../../matrix/RestClient';
import { Credentials } from '../../models/Credentials';
import { PusherParam_ } from '../../models/MatrixApi';

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

    public set(_credentials: Credentials): Promise<void> {
        return Promise.resolve();
    }
}

export default new Pushers();
