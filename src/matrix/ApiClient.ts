import RX from 'reactxp';
import RestClient from './RestClient';
import Sync from './Sync';
import { Credentials } from '../models/Credentials';
import Pushers from '../modules/Pushers';
import { User } from '../models/User';
import DataStore from '../stores/DataStore';
import UiStore from '../stores/UiStore';
import { PREFIX_MEDIA, PREFIX_REST } from '../appconfig';
import { PreviewUrl_, LoginParam_, EmailTokenResponse_, LoginResponse_, AuthParam_, PusherGetResponse_, NewRoomOptions_,
    LoginParamType, RegisterStageType, RoomType, GetPublicRoomsResponse_, StateEventContent_,
    StateEventType, MessageEventContent_, PusherParam_, PushRulesGetResponse_} from '../models/MatrixApi';
import { RoomSummary } from '../models/RoomSummary';
import utils from '../utils/Utils';
import { MessageEvent } from '../models/MessageEvent';

class ApiClient {

    public credentials!: Credentials;
    public isConnected = false;

    public setIsConnected(isConnected: boolean) {

        this.isConnected = isConnected;
    }

    // login + credentials

    public async login(userId: string, password: string, server: string): Promise<void> {

        const restClient = new RestClient('', server, PREFIX_REST);

        const data: LoginParam_ = {
            identifier: {
                type: 'm.id.user',
                user: userId
            },
            type: 'm.login.password',
            user: userId,
            password: password,
        };

        this.stopSync();
        this.clearNextSyncToken();
        await this.clearStorage();
        DataStore.clearRoomSummaryList();

        const response = await restClient.login(data)
            .catch(error => { return Promise.reject(error) });

        this.credentials = {
            userId: userId,
            userIdFull: response.user_id,
            accessToken: response.access_token,
            deviceId: response.device_id,
            homeServer: server,
        };

        this.storeCredentials(this.credentials);
        this.storeLastUserId().catch(_error => null);

        return Promise.resolve();
    }

    public changePassword(newPassword: string, type?: LoginParamType, session?: string, oldPassword?: string)
        : Promise<unknown> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        let auth: LoginParam_;

        if (session) {

            auth = {
                identifier: {
                    type: 'm.id.user',
                    user: this.credentials.userIdFull,
                },
                user: this.credentials.userIdFull,
                type: type,
                password: oldPassword,
                session: session,
            };
        }

        const data = {
            auth: auth!,
            new_password: newPassword,
        };

        return restClient.changePassword(data);
    }

    public requestEmailToken(server: string, clientSecret: string, emailAddress: string, sendAttempt: number)
        : Promise<EmailTokenResponse_> {

        const restClient = new RestClient('', server, PREFIX_REST);

        const data = {
            client_secret: clientSecret,
            email: emailAddress,
            send_attempt: sendAttempt,
        };

        return restClient.requestEmailToken(data);
    }

    public register(userId: string, password: string, server: string, type?: RegisterStageType, session?: string,
        param?: { sid: string, client_secret: string } | string ): Promise<LoginResponse_> {

        const restClient = new RestClient('', server, PREFIX_REST);

        let auth: AuthParam_ | undefined;
        if (session) {

            if (type === 'm.login.email.identity' && typeof(param) !== 'string') {

                auth = {
                    type: type,
                    threepid_creds: param,
                    threepidCreds: param,
                    session: session,
                }

            } else {

                auth = {
                    type: type!,
                    response: param as string,
                    session: session,
                };
            }
        }

        const data = {
            auth: auth,
            username: userId,
            password: password,
            inhibit_login: false,
        };

        return restClient.register(data);
    }

    public setCredentials(credentials: Credentials) {

        this.credentials = {
            userId: credentials.userId,
            userIdFull: credentials.userIdFull,
            accessToken: credentials.accessToken,
            deviceId: credentials.deviceId,
            homeServer: credentials.homeServer,
        };

        this.storeCredentials(this.credentials);
    }

    // pushers

    public getPushers(): Promise<PusherGetResponse_> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.getPushers();
    }

    public setEmailPusher(wantPusher: boolean, emailAddress: string): Promise<void> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        const pusher: PusherParam_ = {
            append: false,
            app_display_name:'Email Notifications',
            app_id: 'm.email',
            device_display_name: emailAddress,
            kind: wantPusher ? 'email' : null,
            pushkey: emailAddress,
            lang: UiStore.getLanguage(),
            data: {},
        };

        return restClient.setPusher(pusher);
    }

    public setPusher() {

        Pushers.set(this.credentials).catch(_error => null);
    }

    public removePusher(appId: string, token: string) {

        Pushers.remove(this.credentials, appId, token).catch(_error => null);
    }

    public removeAllPushers() {

        Pushers.removeAll(this.credentials).catch(_error => null);
    }

    public muteRoomNotifications(roomId: string, muted: boolean): void {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        restClient.muteRoomNotifications(roomId, muted).catch(_error => null);
    }

    public getPushRules(): Promise<PushRulesGetResponse_> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.getPushRules();
    }

    // sync

    public startSync(nextSyncToken: string) {

        Sync.setSyncStopped(false);

        Sync.start(nextSyncToken, this.credentials.accessToken, this.credentials.homeServer);
    }

    public isSyncStopped() {

        return Sync.isSyncStopped();
    }

    public stopSync() {

        Sync.setSyncStopped(true);
    }

    public clearNextSyncToken() {

        Sync.clearNextSyncToken();
    }

    public getNextSyncToken(): string {

        return Sync.getNextSyncToken();
    }

    public setNextSyncToken(nextSyncToken: string) {

        Sync.setNextSyncToken(nextSyncToken);
    }

    // restClient

    public joinRoom(roomId: string): Promise<void> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.joinRoom(roomId);
    }

    public leaveRoom(roomId: string): Promise<void> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.leaveRoom(roomId);
    }

    public inviteToRoom(roomId: string, userId: string): Promise<void> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.inviteToRoom(roomId, userId);
    }

    public createNewRoom(type: string, name?: string, userId?: string, alias?: string, topic?: string, isNotepad?: boolean)
        : Promise<{ room_id: string }> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        let options: NewRoomOptions_;
        if (type === 'direct') {
            options = {
                preset: 'private_chat',
                invite: [userId!],
                // invite_3pid: [emailAddress],
                is_direct: true,
            }
        } else if (isNotepad) {
            options = {
                preset: 'private_chat',
                name: name,
                is_direct: false,
                creation_content: {
                    is_notepad: true,
                }
            }
        } else if (type === 'group') {
            options = {
                initial_state: [
                    {
                        type: 'm.room.join_rules',
                        state_key: '',
                        content: {
                            join_rule: 'invite',
                        }
                    },
                    {
                        type: 'm.room.history_visibility',
                        state_key: '',
                        content: {
                            history_visibility: 'invited',
                        }
                    },
                    {
                        type: 'm.room.guest_access',
                        state_key: '',
                        content: {
                            guest_access: 'forbidden',
                        }
                    },
                ],
                name: name,
                is_direct: false,
            }
        } else if (type === 'community') {
            options = {
                preset: 'public_chat',
                room_alias_name: alias,
                topic: topic,
                name: name,
                visibility: 'public', // makes the community searchable
            }
        }

        return restClient.createNewRoom(options!);
    }

    public getPublicRooms(options: { limit: number, filter: { generic_search_term: string }}, server: string)
        : Promise<GetPublicRoomsResponse_> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.getPublicRooms(options, server);
    }

    public sendStateEvent(roomId: string, type: StateEventType, content: StateEventContent_, stateKey?: string): Promise<void> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.sendStateEvent(roomId, type, content, stateKey);
    }

    public async getRoomEvents(roomId: string, roomType: RoomType, messageCountAdd: number, from: string, previousEventTime: number)
        : Promise<{ events: MessageEvent[], endToken: string, timelineLimited: boolean }> {

        let filter: { types: string[] };
        if (roomType === 'community') {
            filter = {
                types: ['m.room.message', 'm.room.name', 'm.room.avatar', 'm.room.encrypted'],
            };
        } else {
            filter = {
                types: ['m.room.message', 'm.room.member', 'm.room.name', 'm.room.avatar', 'm.room.encrypted'],
            };
        }

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        const response = await restClient.getRoomMessages(roomId, messageCountAdd, 'b', from, '', filter).catch(_error => null);

        if (response) {
            const timelineLimited = messageCountAdd === response.chunk.length;
            const events = utils.filterRoomEvents(response.chunk, roomType, previousEventTime);
            return Promise.resolve({ events: events, endToken: response.end, timelineLimited: timelineLimited });
        } else {
            return Promise.resolve({ events: [], endToken: '', timelineLimited: false });
        }
    }

    public sendReadReceipt(roomId: string, eventId: string): Promise<void> {

        if (!this.isConnected) { return Promise.resolve(); }

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.sendReadReceipt(roomId, eventId);
    }

    public async getRoomMembers(roomId: string, onlyJoined: boolean): Promise<{ [id: string]: User }> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        const members: { [id: string]: User } = {};

        if (onlyJoined) {

            const response = await restClient.getJoinedRoomMembers(roomId).catch(error => { return Promise.reject(error) });

            for (const memberId in response.joined) {
                members[memberId] = {
                    id: memberId,
                    name: response.joined[memberId].display_name,
                    avatarUrl: response.joined[memberId].avatar_url,
                    membership: 'join',
                };
            }

            return members;

        } else {

            const response = await restClient.getRoomMembers(roomId).catch(error => { return Promise.reject(error) });

            response.chunk
                .map(member => {
                    members[member.state_key] = {
                        id: member.state_key,
                        name: member.content.displayname,
                        avatarUrl: member.content.avatar_url,
                        membership: member.content.membership,
                    };
                });

            return members;
        }
    }

    public sendTextMessage(roomId: string, messageContent: MessageEventContent_, tempId: string): Promise<void> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.sendTextMessage(roomId, messageContent, tempId);
    }

    public sendMediaMessage(roomId: string, name: string, mimeType: string, size: number, url: string, tempId: string, width: number,
        height: number): Promise<void> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.sendMediaMessage(roomId, name, mimeType, size, url, tempId, width, height);
    }

    public getPreviewUrl(url: string): Promise<PreviewUrl_> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_MEDIA);

        return restClient.getPreviewUrl(url)!;
    }

    public getUserProfile(userId: string): Promise<{ displayname: string, avatar_url: string }> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.getUserProfile(userId);
    }

    public get3pid(): Promise<{ threepids: [{ medium: string, address: string}] }> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.get3pid();
    }

    public setProfileDisplayName(userId: string, displayName: string): Promise<void> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.setProfileDisplayName(userId, displayName);
    }

    public setProfileAvatarUrl(userId: string, avatarUrl: string): Promise<void> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.setProfileAvatarUrl(userId, avatarUrl);
    }

    public getPresence(userId: string): Promise<{ last_active_ago: number }> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.getPresence(userId);
    }

    public getMatrixVersions(): Promise<unknown> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, '');

        return restClient.getMatrixVersions();
    }

    public getHomeserverInfo(): Promise<unknown> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, '');

        return restClient.getHomeserverInfo();
    }

    public reportMessage(roomId: string, eventId: string): Promise<void> {

        const restClient = new RestClient(this.credentials.accessToken, this.credentials.homeServer, PREFIX_REST);

        return restClient.reportMessage(roomId, eventId);
    }

    // local storage

    private storeCredentials(credentials: Credentials): void {

        RX.Storage.setItem('credentials', JSON.stringify(credentials)).catch(_error => null);
    }

    public storeDatastore(): Promise<[void, void]> {

        const storeRoomSummary = async function(): Promise<void> {

            const roomSummaryList = DataStore.getRoomSummaryList();

            await RX.Storage.setItem('roomSummaryList', JSON.stringify(roomSummaryList)).catch(error => { return Promise.reject(error) });

            return Promise.resolve();
        }

        const storeLastSeenTime = async function(): Promise<void> {

            const lastSeenTime = DataStore.getLastSeenTimeArray();

            await RX.Storage.setItem('lastSeenTime', JSON.stringify(lastSeenTime)).catch(error => { return Promise.reject(error) });

            return Promise.resolve();
        }

        return Promise.all([storeRoomSummary(), storeLastSeenTime()]);
    }

    public restoreDataStore(): Promise<[void, void]> {

        const restoreRoomSummary = async function(): Promise<void> {

            const response = await RX.Storage.getItem('roomSummaryList').catch(error => { return Promise.reject(error) });

            const roomSummaryList = JSON.parse(response!) as RoomSummary[];

            if (roomSummaryList.length === 0) {
                return Promise.reject('roomSummaryList empty');
            }

            DataStore.setRoomSummaryListFromStorage(roomSummaryList);

            return Promise.resolve();
        }

        const restoreLastSeenTime = async function(): Promise<void> {

            const response = await RX.Storage.getItem('lastSeenTime').catch(error => { return Promise.reject(error) });

            const lastSeenTime = JSON.parse(response!) as { [id: string]: number };

            DataStore.setLastSeenTimeFromStorage(lastSeenTime);

            return Promise.resolve();
        }

        return Promise.all([restoreRoomSummary(), restoreLastSeenTime()]);
    }

    public async clearStorage() {

        await RX.Storage.clear();
        await RX.Storage.setItem('appColor', UiStore.getAppColor());

        if (UiStore.getIsElectron()) {
            const { webFrame } = window.require('electron');
            const currentZoomFactor = webFrame.getZoomFactor();
            this.storeZoomFactor(currentZoomFactor);
        }
    }

    public async getStoredCredentials(): Promise<Credentials | undefined> {

        const credentials = await RX.Storage.getItem('credentials');

        if (credentials) {
            this.credentials = JSON.parse(credentials) as Credentials;
            return Promise.resolve(this.credentials);
        } else {
            return Promise.resolve(undefined);
        }
    }

    public async storeLastUserId(): Promise<void> {

        await RX.Storage.setItem('lastUserId', this.credentials.userIdFull);
    }

    public async getStoredLastUserId(): Promise<string | undefined> {

        const lastUserId = await RX.Storage.getItem('lastUserId');

        return Promise.resolve(lastUserId ? lastUserId : undefined);
    }

    public storeZoomFactor(zoomFactor: number): void {

        RX.Storage.setItem('zoomFactor', zoomFactor.toString()).catch(_error => null);
    }

    public async getStoredZoomFactor(): Promise<number | undefined> {

        const zoomFactor = await RX.Storage.getItem('zoomFactor');

        return Promise.resolve(zoomFactor ? Number(zoomFactor) : undefined);
    }

    public getStoredSyncToken(): Promise<string | undefined> {

        return RX.Storage.getItem('syncToken');
    }

    public storeSyncToken(): Promise<void> {

        const syncToken = Sync.getNextSyncToken();

        return RX.Storage.setItem('syncToken', syncToken);
    }

    public storeAppData = async () => {

        const nextSyncToken = this.getNextSyncToken();

        if (nextSyncToken) {

            const storedSyncToken = await this.getStoredSyncToken();

            if (storedSyncToken !== nextSyncToken) {
                await this.storeDatastore();
                await this.storeSyncToken();
            }
        }
    }
}

export default new ApiClient();