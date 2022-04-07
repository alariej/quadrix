import RX from 'reactxp';
import React from 'react';
import RestClient from './RestClient';
import DataStore from '../stores/DataStore';
import { INPUT_TEXT, FONT_LARGE } from '../ui';
import { MESSAGE_COUNT_INC,  } from '../appconfig';
import UiStore from '../stores/UiStore';
import DialogContainer from '../modules/DialogContainer';
import { syncError } from '../translations';
import { PREFIX_REST } from '../appconfig';
import { ErrorResponse_, EventsFilter_, RoomFilter_, SyncFilter_, SyncResponse_ } from '../models/MatrixApi';
import AppFont from '../modules/AppFont';

const styles = {
    textDialog: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        textAlign: 'center',
        color: INPUT_TEXT,
        fontSize: FONT_LARGE,
        margin: 12,
    }),
}

const syncTimeout = 60000;

const accountFilterRoom: EventsFilter_ = {
    limit: 0,
    types: [],
};

const roomFilter: RoomFilter_ = {
    timeline: {
        limit: MESSAGE_COUNT_INC,
        lazy_load_members: true,
        types: [
            'm.room.third_party_invite',
            'm.room.redaction',
            'm.room.message',
            'm.room.member',
            'm.room.name',
            'm.room.avatar',
            'm.room.canonical_alias',
            'm.room.join_rules',
            'm.room.power_levels',
            'm.room.topic',
            'm.room.encrypted',
            'm.room.create',
        ],
    },
    state: {
        lazy_load_members: true,
        types: [
            'm.room.member',
            'm.room.name',
            'm.room.avatar',
            'm.room.canonical_alias',
            'm.room.join_rules',
            'm.room.power_levels',
            'm.room.topic',
            'm.room.create',
        ],
    },
    ephemeral: {
        lazy_load_members: true,
        types: ['m.receipt'],
    },
    include_leave: true,
    account_data: accountFilterRoom,
};

const accountFilter: EventsFilter_ = {
    types: ['m.direct'],
};

const filter: SyncFilter_ = {
    room: roomFilter,
    account_data: accountFilter,
    presence: { types: ['m.presence'] },
};

let i = 0;

class Sync {

    private restClient!: RestClient;
    private nextSyncToken = '';
    private syncStopped = false;
    private serverOffline = false;

    public start = (syncToken: string, accessToken: string, server: string) => {

        if (!this.restClient || !syncToken) { this.restClient = new RestClient(accessToken, server, PREFIX_REST); }

        if (syncToken) {

            this.incrementalSync(syncToken, 1000);

        } else {

            this.initialStateSync()
                .then((syncData) => {

                    if (!syncData) {
                        DataStore.setSyncComplete(true);
                    }

                    DataStore.buildRoomSummaryList(syncData);

                    this.incrementalSync('', 1000);
                })
                .catch((_error) => {

                    const text = (
                        <RX.Text style={ styles.textDialog }>
                            { syncError[UiStore.getLanguage()] }
                        </RX.Text>
                    );

                    RX.Modal.show(<DialogContainer content={ text }/>, 'errordialog');
                });
        }
    }

    private initialStateSync = (): Promise<SyncResponse_> => {

        const accountFilterRoom_: EventsFilter_ = {
            limit: 0,
            types: [],
        };

        const roomFilter_: RoomFilter_ = {
            timeline: {
                limit: 0,
                types: [],
            },
            state: {
                lazy_load_members: true,
                types: [
                    'm.room.third_party_invite',
                    'm.room.member',
                    'm.room.name',
                    'm.room.avatar',
                    'm.room.canonical_alias',
                    'm.room.join_rules',
                    'm.room.power_levels',
                    'm.room.topic',
                    'm.room.create',
                ],
            },
            ephemeral: {
                limit: 0,
                types: [],
            },
            include_leave: false,
            account_data: accountFilterRoom_,
        };

        const accountFilter_: EventsFilter_ = {
            types: ['m.direct', 'm.push_rules'],
        };

        const filter_: SyncFilter_ = {
            room: roomFilter_,
            account_data: accountFilter_,
            presence: { types: ['m.presence'] },
        };

        return this.restClient.getSyncFiltered('', filter_, 1000, true);
    }

    private incrementalSync = (syncToken: string, timeout: number) => {

        if (this.syncStopped && !this.serverOffline ) { return; }

        i = i + 1;

        this.restClient.getSyncFiltered(syncToken, filter, timeout, false)
            .then(syncData => {

                if (UiStore.getOffline()) { UiStore.setOffline(false) }
                this.serverOffline = false;

                if (!this.syncStopped && (!syncToken || (syncToken === this.nextSyncToken))) {

                    if (!syncToken) {
                        DataStore.updateRoomSummaryListInitial(syncData);
                    } else {
                        DataStore.updateRoomSummaryList(syncData);
                    }

                    DataStore.updateUserPresence(syncData);

                    this.nextSyncToken = syncData.next_batch!;

                    this.incrementalSync(syncData.next_batch!, syncTimeout);
                }
            })
            .catch((error: ErrorResponse_) => {

                UiStore.setOffline(true);
                this.serverOffline = true;

                DataStore.setSyncComplete(true);

                if (error?.body?.errcode === 'M_UNKNOWN_TOKEN') {
                    UiStore.setUnknownAccessToken(true);
                }

                setTimeout(() => {
                    this.incrementalSync(syncToken, syncTimeout);
                }, 15000);
            });
    }

    public getNextSyncToken() {
        return this.nextSyncToken;
    }

    public setNextSyncToken(nextSyncToken: string) {
        this.nextSyncToken = nextSyncToken;
    }

    public clearNextSyncToken() {
        this.nextSyncToken = '';
    }

    public isSyncStopped() {
        return this.syncStopped;
    }

    public setSyncStopped(isStopped: boolean) {
        this.syncStopped = isStopped;
    }
}

export default new Sync();
