import { Table } from 'liteorm';
export declare class Decks {
    id: number;
    name: string;
}
export declare const dbDecks: Table<Decks, {}, Decks>;
export declare class Models {
    id: number;
    name: string;
    flds: string[];
    css: string;
}
export declare const dbModels: Table<Models, {}, Models>;
export declare class Templates {
    id: number;
    mid: string;
    name: string;
    qfmt: string;
    afmt: string;
}
export declare const dbTemplates: Table<Templates, {}, Templates>;
/**
 * col contains a single row that holds various information about the collection
 *
 * ```sql
 * CREATE TABLE col (
        id              integer primary key,
        -- arbitrary number since there is only one row
        crt             integer not null,
        -- created timestamp
        mod             integer not null,
        -- last modified in milliseconds
        scm             integer not null,
        -- schema mod time: time when "schema" was modified.
        --   If server scm is different from the client scm a full-sync is required
        ver             integer not null,
        -- version
        dty             integer not null,
        -- dirty: unused, set to 0
        usn             integer not null,
        -- update sequence number: used for finding diffs when syncing.
        --   See usn in cards table for more details.
        ls              integer not null,
        -- "last sync time"
        conf            text not null,
        -- json object containing configuration options that are synced
        models          text not null,
        -- json array of json objects containing the models (aka Note types)
        decks           text not null,
        -- json array of json objects containing the deck
        dconf           text not null,
        -- json array of json objects containing the deck options
        tags            text not null
        -- a cache of tags used in the collection (This list is displayed in the browser. Potentially at other place)
    );
    ```
 */
export declare class Col {
    id: number;
    crt: number;
    mod: number;
    scm: number;
    ver: number;
    dty: number;
    usn: number;
    ls: number;
    conf: Record<string, unknown>;
    models: Record<string, unknown>;
    decks: Record<string, unknown>;
    dconf: Record<string, unknown>;
    tags: Record<string, unknown>;
}
export declare const dbCol: Table<Col, {}, Col>;
//# sourceMappingURL=index.d.ts.map