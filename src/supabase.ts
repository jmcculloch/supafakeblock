require('rxdb-supabase');

import { createRxDatabase, RxJsonSchema } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { createClient, SupabaseClient } from '@supabase/supabase-js';
//@ts-ignore
import { SupabaseReplication } from 'rxdb-supabase';
import { Report, ReportStats } from './types';

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
            // TODO: I do not believe we need suffix this
            replicationIdentifier: "myId" + SUPABASE_URL,
            pull: {
                realtimePostgresChanges: true
            },
            push: {},
            autoStart: true,
        });

        return this.instance;
    }

    public async isBlacklisted(profileId: number): Promise<boolean> {
        const result = await this.myCollection?.blacklist.findOne({
            selector: {
                id: profileId
            }
        }).exec();

        return result != null;
    }

    public async getReportStats(profileId: number): Promise<ReportStats | null> {
        const { data, error } = await this.supabaseClient.from('report_stats_view').select().eq('blacklist_id', profileId);

        if(error) {
            console.log(`Error: `, error);
        }

        return data[0];
    }

    // TODO: This requires public/anon write access to the report table, which is not ideal.
    public async report(report: Report): Promise<void> {
        // TODO: temporary workaround issue#8
        // This could potentially cause some replication issues
        this.myCollection.blacklist.insert({
            id: report.profileId
        });

        const { error } = await this.supabaseClient.from('report').insert({
            blacklist_id: report.profileId,
            // TODO: empty->null?
            notes: report.notes,
            confidence: report.confidence,
            type: report.type,
            // TODO: authentication
            reporter: report.reporter,
            vote: report.dispute ?? false
        });

        if(error) {
            console.log(`Error: `, error);
        }
    }

    public async getBlacklistCount(): Promise<number> {
        return await this.myCollection.blacklist.count({}).exec();
    }

    /**
     * Utility to delete the local indexeddb tables, which are not visible in Devtools
     */
    public static deleteLocalBlacklist(): void {
        [
            'rxdb-dexie-blacklist--0--_rxdb_internal',
            'rxdb-dexie-blacklist--0--blacklist',
            // TODO: I do not believe we need suffix this
            'rxdb-dexie-blacklist--0--blacklist-rx-replication-myIdhttps://vknwqxfqzcusbhjjkeoo.supabase.co'
        ].forEach((name) => indexedDB.deleteDatabase(name));
    }
}
