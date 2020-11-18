import { Db, Entity, Table, primary, prop } from 'liteorm'
import { nanoid } from 'nanoid'
import stripHtml from 'string-strip-html'

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
@Entity()
export class Col {
  @primary({ default: 1 }) id?: number
  @prop({ type: 'int', default: () => Math.floor(+new Date() / 1000) })
  crt?: number

  @prop({ type: 'int', default: () => Math.floor(+new Date()) }) mod?: number
  @prop({ type: 'int', default: 0 }) scm?: number
  @prop({ type: 'int', default: 16 }) ver?: number
  @prop({ type: 'int', default: 0 }) dty?: number
  @prop({ type: 'int', default: 19 }) usn?: number
  @prop({ type: 'int', default: 0 }) ls?: number
  @prop({ default: '' }) conf?: Record<string, unknown>
  @prop({ default: '' }) models?: Record<string, unknown>
  @prop({ default: '' }) decks?: Record<string, unknown>
  @prop({ default: '' }) dconf?: Record<string, unknown>
  @prop({ default: '' }) tags?: Record<string, unknown>
}

export const dbCol = new Table(Col)

/**
 * json object containing configuration options that are synced
 */
@Entity({ withoutRowID: true })
export class Config {
  @prop({ index: true }) key!: string
  @prop({ type: 'int', default: 0 }) usn?: number
  @prop({ type: 'int', default: 0 }) mtimeSec?: number
  @prop() val!: ArrayBuffer
}

export const dbConfig = new Table(Config)

/**
 * json array of json objects containing the deck options
 */
@Entity()
export class DeckConfig {
  @primary({ autoincrement: true }) id!: number
  @prop({ collate: 'unicase' }) name!: string

  @prop({ type: 'int', default: () => Math.floor(+new Date() / 1000) })
  mtimeSecs?: number

  @prop({ type: 'int', default: 0 }) usn?: number
  @prop() config!: ArrayBuffer
}

export const dbDeckConfig = new Table(DeckConfig)

/**
 * json array of json objects containing the deck options
 */
@Entity()
export class Decks {
  @primary({ autoincrement: true }) id!: number
  @prop({ collate: 'unicase', index: 'idx_decks_name' }) name!: string

  @prop({ type: 'int', default: () => Math.floor(+new Date() / 1000) })
  mtimeSecs?: number

  @prop({ type: 'int', default: 0 }) usn?: number
  @prop() common!: ArrayBuffer
  @prop() kind!: ArrayBuffer
}

export const dbDecks = new Table(Decks)

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
@Entity()
export class Graves {
  @prop({ type: 'int', default: -1 }) usn?: number
  @prop({ type: 'int' }) oid!: number
  @prop({ type: 'int' }) type!: number
}

export const dbGraves = new Table(Graves)

@Entity()
export class Notetypes {
  @primary({ autoincrement: true }) id!: number
  @prop({ collate: 'unicase', index: 'idx_notetypes_name' }) name!: string

  @prop({ type: 'int', default: () => Math.floor(+new Date() / 1000) })
  mtimeSecs?: number

  @prop({ type: 'int', default: 0, index: 'idx_notetypes_usn' }) usn?: number
  @prop() config!: ArrayBuffer
}

export const dbNotetypes = new Table(Notetypes)

// eslint-disable-next-line no-use-before-define
@Entity<Fields>({
  primary: ['ntid', 'ord'],
  index: [{ name: 'idx_fields_name_ntid', keys: ['name', 'ntid'] }],
  withoutRowID: true
})
export class Fields {
  @prop({ type: 'int', references: dbNotetypes }) ntid!: number
  @prop({ type: 'int' }) ord!: number
  @prop({ collate: 'unicase' }) name!: string
  @prop() config!: ArrayBuffer
}

export const dbFields = new Table(Fields)

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
@Entity()
export class Notes {
  @primary({ autoincrement: true }) id!: number
  @prop({ unique: true, default: () => nanoid() }) guid?: string

  @prop({ type: 'int', references: dbNotetypes, index: 'idx_notes_mid' })
  mid!: number

  @prop({ type: 'int', onChange: () => Math.floor(+new Date()) }) mod?: number
  @prop({ type: 'int', default: -1, index: 'ix_notes_usn' }) usn?: number

  @prop<string[]>({
    type: 'string',
    transform: {
      get: (r: string) => r.split(' ').filter((el) => el),
      set: (d) => d.join(' ')
    },
    default: () => []
  })
  tags?: string[]

  @prop<string[]>({
    type: 'string',
    transform: {
      get: (r: string) => r.split('\x1f').filter((el) => el),
      set: (d) => d.join('\x1f')
    }
  })
  flds!: string[]

  @prop() sfld?: string
  @prop({ type: 'int', index: 'ix_notes_csum' }) csum?: number
  @prop({ type: 'int', default: 0 }) flags?: number
  @prop({ default: '' }) data?: string
}

export const dbNotes = new Table(Notes)

dbNotes.on('pre-create', (d) => {
  d.entry.sfld = stripHtml(d.entry.flds[0]).result
})

/**
 * Empty table, despite already created some tags
 */
@Entity({ withoutRowID: true })
export class Tags {
  @prop({ index: true, collate: 'unicase' }) tag!: string
  @prop({ type: 'int', default: 0 }) usn?: number
}

export const dbTags = new Table(Tags)

// eslint-disable-next-line no-use-before-define
@Entity<Templates>({
  primary: ['ntid', 'ord'],
  index: [
    {
      name: 'idx_templates_name_ntid',
      keys: ['name', 'ntid']
    }
  ],
  withoutRowID: true
})
export class Templates {
  @prop({ type: 'int', references: dbNotetypes }) ntid!: number
  @prop({ type: 'int', default: 0 }) ord?: number
  @prop({ collate: 'unicase' }) name!: string
  @prop({ type: 'int', default: 0 }) mtimeSecs?: number
  @prop({ type: 'int', default: 0, index: 'idx_templates_usn' }) usn?: number
  @prop() config!: ArrayBuffer
}

export const dbTemplates = new Table(Templates)

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
// eslint-disable-next-line no-use-before-define
@Entity<Cards>({
  index: [{ name: 'ix_cards_sched', keys: ['did', 'queue', 'due'] }]
})
export class Cards {
  @primary({ autoincrement: true }) id?: number
  @prop({ type: 'int', references: dbNotes, index: 'ix_cards_nid' })
  nid!: number

  @prop({ type: 'int', references: dbDecks }) did!: number
  @prop({ type: 'int' }) ord!: number
  @prop({ type: 'int', onChange: () => Math.floor(+new Date()) }) mod?: number
  @prop({ type: 'int', default: -1, index: 'ix_cards_usn' }) usn?: number
  @prop({ type: 'int', default: 0 }) queue?: number
  @prop({ type: 'int' }) due?: number
  @prop({ type: 'int', default: 0 }) ivl?: number
  @prop({ type: 'int', default: 0 }) factor?: number
  @prop({ type: 'int', default: 0 }) reps?: number
  @prop({ type: 'int', default: 0 }) lapses?: number
  @prop({ type: 'int', default: 0 }) left?: number
  @prop({ type: 'int', default: 0 }) odue?: number
  @prop({ type: 'int', default: 0, index: 'idx_cards_odid' }) odid?: number
  @prop({ type: 'int', default: 0 }) flags?: number
  @prop({ default: '' }) data?: string
}

export const dbCards = new Table(Cards)

dbCards.on('pre-create', (d) => {
  d.entry.due = d.entry.nid
})

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
@Entity()
export class Revlog {
  @primary({ autoincrement: true }) id?: number
  @prop({ type: 'int', references: dbCards, index: 'ix_revlog_cid' })
  cid!: number

  @prop({ type: 'int', default: -1, index: 'ix_revlog_usn' }) usn?: number
  @prop({ type: 'int' }) ease!: number
  @prop({ type: 'int' }) ivl!: number
  @prop({ type: 'int' }) lastIvl!: number
  @prop({ type: 'int' }) factor!: number
  @prop({ type: 'int' }) time!: number
  @prop({ type: 'int' }) type!: number
}

export const dbRevlog = new Table(Revlog)

export function initDatabase(filename: string) {
  const db = new Db(filename)
  return db
}
