import { Db, Table } from 'liteorm';
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
    id?: number;
    crt?: number;
    mod?: number;
    scm?: number;
    ver?: number;
    dty?: number;
    usn?: number;
    ls?: number;
    conf?: Record<string, unknown>;
    models?: Record<string, unknown>;
    decks?: Record<string, unknown>;
    dconf?: Record<string, unknown>;
    tags?: Record<string, unknown>;
}
export declare const dbCol: Table<Col, {}, Col>;
/**
 * json object containing configuration options that are synced
 */
export declare class Config {
    key: string;
    usn?: number;
    mtimeSec?: number;
    val: ArrayBuffer;
}
export declare const dbConfig: Table<Config, {}, Config>;
/**
 * json array of json objects containing the deck options
 */
export declare class DeckConfig {
    id: number;
    name: string;
    mtimeSecs?: number;
    usn?: number;
    config: ArrayBuffer;
}
export declare const dbDeckConfig: Table<DeckConfig, {}, DeckConfig>;
/**
 * json array of json objects containing the deck options
 */
export declare class Decks {
    id: number;
    name: string;
    mtimeSecs?: number;
    usn?: number;
    common: ArrayBuffer;
    kind: ArrayBuffer;
}
export declare const dbDecks: Table<Decks, {}, Decks>;
/**
 * ```sql
 * -- Contains deleted cards, notes, and decks that need to be synced.
  -- usn should be set to -1,
  -- oid is the original id.
  -- type: 0 for a card, 1 for a note and 2 for a deck
    CREATE TABLE graves (
        usn             integer not null,
        oid             integer not null,
        type            integer not null
    );
 * ```
 */
export declare class Graves {
    usn?: number;
    oid: number;
    type: number;
}
export declare const dbGraves: Table<Graves, {}, Graves>;
export declare class Notetypes {
    id: number;
    name: string;
    mtimeSecs?: number;
    usn?: number;
    config: ArrayBuffer;
}
export declare const dbNotetypes: Table<Notetypes, {}, Notetypes>;
export declare class Fields {
    ntid: number;
    ord: number;
    name: string;
    config: ArrayBuffer;
}
export declare const dbFields: Table<Fields, {}, Fields>;
/**
 * ```sql
 * -- Notes contain the raw information that is formatted into a number of cards
  -- according to the models
  CREATE TABLE notes (
      id              integer primary key,
      -- epoch seconds of when the note was created
      guid            text not null,
      -- globally unique id, almost certainly used for syncing
      mid             integer not null,
      -- model id
      mod             integer not null,
      -- modification timestamp, epoch seconds
      usn             integer not null,
      -- update sequence number: for finding diffs when syncing.
      --   See the description in the cards table for more info
      tags            text not null,
      -- space-separated string of tags.
      --   includes space at the beginning and end, for LIKE "% tag %" queries
      flds            text not null,
      -- the values of the fields in this note. separated by 0x1f (31) character.
      sfld            text not null,
      -- sort field: used for quick sorting and duplicate check
      csum            integer not null,
      -- field checksum used for duplicate check.
      -- integer representation of first 8 digits of sha1 hash of the first field
      flags           integer not null,
      -- unused
      data            text not null
      -- unused
  );
 * ```
 */
export declare class Notes {
    id: number;
    guid?: string;
    mid: number;
    mod?: number;
    usn?: number;
    tags?: string[];
    flds: string[];
    sfld?: string;
    csum?: number;
    flags?: number;
    data?: string;
}
export declare const dbNotes: Table<Notes, {}, Notes>;
/**
 * Empty table, despite already created some tags
 */
export declare class Tags {
    tag: string;
    usn?: number;
}
export declare const dbTags: Table<Tags, {}, Tags>;
export declare class Templates {
    ntid: number;
    ord?: number;
    name: string;
    mtimeSecs?: number;
    usn?: number;
    config: ArrayBuffer;
}
export declare const dbTemplates: Table<Templates, {}, Templates>;
/**
 * ```sql
 * -- Cards are what you review.
  -- There can be multiple cards for each note, as determined by the Template.
  CREATE TABLE cards (
      id              integer primary key,
      -- the epoch milliseconds of when the card was created
      nid             integer not null,--
      -- notes.id
      did             integer not null,
      -- deck id (available in col table)
      ord             integer not null,
      -- ordinal : identifies which of the card templates it corresponds to
      --   valid values are from 0 to num templates - 1
      mod             integer not null,
      -- modificaton time as epoch seconds
      usn             integer not null,
      -- update sequence number : used to figure out diffs when syncing.
      --   value of -1 indicates changes that need to be pushed to server.
      --   usn < server usn indicates changes that need to be pulled from server.
      type            integer not null,
      -- 0=new, 1=learning, 2=due, 3=filtered
      queue           integer not null,
      -- -3=sched buried, -2=user buried, -1=suspended,
      -- 0=new, 1=learning, 2=due (as for type)
      -- 3=in learning, next rev in at least a day after the previous review
      due             integer not null,
      -- Due is used differently for different card types:
      --   new: note id or random int
      --   due: integer day, relative to the collection's creation time
      --   learning: integer timestamp
      ivl             integer not null,
      -- interval (used in SRS algorithm). Negative = seconds, positive = days
      factor          integer not null,
      -- factor (used in SRS algorithm)
      reps            integer not null,
      -- number of reviews
      lapses          integer not null,
      -- the number of times the card went from a "was answered correctly"
      --   to "was answered incorrectly" state
      left            integer not null,
      -- of the form a*1000+b, with:
      -- b the number of reps left till graduation
      -- a the number of reps left today
      odue            integer not null,
      -- original due: only used when the card is currently in filtered deck
      odid            integer not null,
      -- original did: only used when the card is currently in filtered deck
      flags           integer not null,
      -- currently unused
      data            text not null
      -- currently unused
  );
  ```
 */
export declare class Cards {
    id?: number;
    nid: number;
    did: number;
    ord: number;
    mod?: number;
    usn?: number;
    queue?: number;
    due?: number;
    ivl?: number;
    factor?: number;
    reps?: number;
    lapses?: number;
    left?: number;
    odue?: number;
    odid?: number;
    flags?: number;
    data?: string;
}
export declare const dbCards: Table<Cards, {}, Cards>;
/**
 * ```sql
 * -- revlog is a review history; it has a row for every review you've ever done!
  CREATE TABLE revlog (
      id              integer primary key,
      -- epoch-milliseconds timestamp of when you did the review
      cid             integer not null,
      -- cards.id
      usn             integer not null,
      -- update sequence number: for finding diffs when syncing.
      --   See the description in the cards table for more info
      ease            integer not null,
      -- which button you pushed to score your recall.
      -- review:  1(wrong), 2(hard), 3(ok), 4(easy)
      -- learn/relearn:   1(wrong), 2(ok), 3(easy)
      ivl             integer not null,
      -- interval
      lastIvl         integer not null,
      -- last interval
      factor          integer not null,
      -- factor
      time            integer not null,
      -- how many milliseconds your review took, up to 60000 (60s)
      type            integer not null
      --  0=learn, 1=review, 2=relearn, 3=cram
  );
 * ```
 */
export declare class Revlog {
    id?: number;
    cid: number;
    usn?: number;
    ease: number;
    ivl: number;
    lastIvl: number;
    factor: number;
    time: number;
    type: number;
}
export declare const dbRevlog: Table<Revlog, {}, Revlog>;
export declare function initDatabase(filename: string): Promise<Db>;
//# sourceMappingURL=index.d.ts.map