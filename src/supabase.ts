require('rxdb-supabase');

import { createRxDatabase, RxJsonSchema } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { createClient } from '@supabase/supabase-js';
//@ts-ignore
import { SupabaseReplication } from 'rxdb-supabase';
import { ScammerType } from './types';

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

    public static async init(): Promise<Supabase> {
        if(this.instance != null) {
            return this.instance;
        }

        this.instance = new Supabase();
        const db = await createRxDatabase({
            name: 'scammers',
            storage: getRxStorageDexie()
        });

        this.instance.myCollection = await db.addCollections({
            scammers: {
                schema: SCHEMA
            }
        });

        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const replication = new SupabaseReplication({
            supabaseClient: supabaseClient,
            collection: this.instance.myCollection.scammers,
            replicationIdentifier: "myId" + SUPABASE_URL,
            pull: {
                realtimePostgresChanges: true
            },
            push: {},
            autoStart: true,
        });

        return this.instance;
    }

    public async isScammer(profileId: number): Promise<boolean> {
        if (this.myCollection) {
            const result = await this.myCollection.scammers.findOne({
                selector: {
                    id: profileId
                }
            }).exec();

            return result != null;
        }

        return false;
    }

    // TODO: This requires public/anon write access to the scammers table, which is not ideal. Need to replace
    // with a proper reporting/review mechanism, authentication, etc.
    public report(profileId: number,
        type: ScammerType = ScammerType.SCAMMER,
        confidence: number = 0.5): void {
        this.myCollection.scammers.insert({
            id: profileId
        });
    }
}

Supabase.init();