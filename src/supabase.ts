require('rxdb-supabase');

import { createRxDatabase, RxJsonSchema } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
//@ts-ignore
import { SupabaseReplication } from 'rxdb-supabase';
import { Report, ReportStats, ReportType } from './types';

// TODO: configurable?
const SUPABASE_URL = 'https://vknwqxfqzcusbhjjkeoo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbndxeGZxemN1c2JoamprZW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTE0OTg5NzAsImV4cCI6MjAyNzA3NDk3MH0.I9pgT0pAY_Z0CJJL6TjHx3jcBrfJ7QSYHhS7UDBgz-8';

const SCHEMA: RxJsonSchema<any> = {
    version: 0,
    primaryKey: "id",
    type: "object",
    properties: {
        id: {
            type: "integer",
            // TODO: why does primary key require maxlength is specified?
            maxLength: 100,
        },
    },
    required: ["id"],
    indexes: ["id"],
};

export class Supabase {
    private myCollection: any;
    private static instance : Supabase;
    public supabaseClient: SupabaseClient;

    constructor() {
        this.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    public static async init(): Promise<Supabase> {
        if(this.instance != null) {
            return this.instance;
        }

        this.instance = new Supabase();
        const db = await createRxDatabase({
            name: 'blacklist',
            storage: getRxStorageDexie()
        });

        this.instance.myCollection = await db.addCollections({
            blacklist: {
                schema: SCHEMA
            }
        });

        const replication = new SupabaseReplication({
            supabaseClient: this.instance.supabaseClient,
            collection: this.instance.myCollection.blacklist,
            replicationIdentifier: "myId" + SUPABASE_URL,
            pull: {
                realtimePostgresChanges: true
            },
            // NOTE: A null push entry disables pushes from writes to local table
            // This is necessary for watch functionality
            // push: {},
            autoStart: true,
        });

        return this.instance;
    }

    public async isBlacklisted(profileId: number): Promise<ReportStats | null> {
        // Query local blacklist table
        const result = await this.myCollection?.blacklist.findOne({
            selector: {
                id: profileId
            }
        }).exec();

        // No entry in local blacklist
        if(!result) {
            return null;
        }

        // TODO: cache?
        const stats = await this.getReportStats(profileId);

        // TODO: avgConfidence?, string/number?
        // If null, this is a local "WATCH" status that doesn't have a report logged against it, inject here
        return stats ? stats : { type: ReportType.WATCH, avgConfidence: '1.00' };
    }

    public async getReportStats(profileId: number): Promise<ReportStats | null> {
        const { data, error } = await this.supabaseClient.from('report_stats_view').select().eq('blacklist_id', profileId);

        if(error) {
            console.log(`Error: `, error);
        }

        return data[0] ? {
            type: data[0].type,
            upVotes: data[0].up_votes,
            downVotes: data[0].down_votes,
            avgConfidence: data[0].avg_confidence.toFixed(2) ?? '0.00'
        } : null;
    }

    // TODO: throws Error?
    public async report(report: Report): Promise<void | Error> {
        const { error } = await this.supabaseClient.from('report').insert({
            blacklist_id: report.profileId,
            // TODO: empty->null?
            notes: report.notes,
            confidence: report.confidence,
            type: report.type,
            vote: !report.dispute ?? true
        });

        // TODO: rethink void|Error
        return error;
    }

    public async watch(report: Report): Promise<void> {
        // TODO: Save state, keyed off report.profileId of other values to complete a report?
        this.myCollection.blacklist.insert({
            id: report.profileId
        });
    }

    public async getBlacklistCount(): Promise<number> {
        return await this.myCollection.blacklist.count().exec();
    }

    /**
     * Utility to delete the local indexeddb tables, which are not visible in Devtools
     */
    public static async deleteLocalBlacklist(): Promise<void> {
       (await indexedDB.databases()).filter((db) => db.name?.startsWith('rxdb-dexie-blacklist')).forEach((db) => indexedDB.deleteDatabase(db.name!));
    }

    public async signIn(authenticatedCallback: (user: User) => void): Promise<void> {
        // The documentation is unclear, or performs differently within an extension context.
        // This returns a suitable URL for the subsequent launchWebAuthFlow call
        const { data } = await this.supabaseClient.auth.signInWithOAuth(({
            provider: 'facebook',
            options: {
                redirectTo: chrome.identity.getRedirectURL(),
                // TODO: is this necessary or default?
                scopes: 'public_profile,email',
            }
        }));

        chrome.identity.launchWebAuthFlow({
            url: data.url!,
            interactive: true
        }, async (responseUrl) => {
            if (chrome.runtime.lastError) {
                // auth was not successful
                console.log(`chrome.runtime.lastError: `, chrome.runtime.lastError);
            }
            else {
                // auth was successful, extract the ID token from the redirectedTo URL
                const url = new URL(responseUrl!);
                // redirect URL is ${chrome.identity.getRedirectURL()/#access_token=... no ? search params
                // hence the substring(1)
                const params = new URLSearchParams(url.hash.substring(1));

                const accessToken = params.get('access_token')!;
                const refreshToken = params.get('refresh_token')!;

                this.setUserInLocalStorage(accessToken, refreshToken);

                const user = (await this.supabaseClient.auth.setSession({
                    access_token: params.get('access_token')!,
                    refresh_token: params.get('refresh_token')!
                })).data.user;

                if(user) {
                    authenticatedCallback(user);
                }
                // TODO: else?
            }
        });
    }

    public async signOut(): Promise<void> {
        this.removeUserInLocalStorage();
        await this.supabaseClient.auth.signOut();
    }

    public async getUserFromLocalStorage(): Promise<User | null> {
        // TODO: chrome.storage.session ?
        const tokens = await chrome.storage.local.get(['accessToken', 'refreshToken']);

        if(!tokens.accessToken && !tokens.refreshToken) {
            return null;
        }

        const { data, error } = await this.supabaseClient.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken
        });

        if(error) {
            console.log(`Error: `, error);
        }

        return data.user;
    }

    private async setUserInLocalStorage(accessToken?: string, refreshToken?: string): Promise<void> {
        // TODO: refactor local storage of tokens
        chrome.storage.local.set({
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    }

    // TODO: rename tokens vs user
    private async removeUserInLocalStorage(): Promise<void> {
        // TODO: refactor local storage of tokens
        chrome.storage.local.remove(['accessToken', 'refreshToken']);
    }
}
