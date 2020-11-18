import { Entity, Table, primary, prop } from 'liteorm'

// Missing tables in Anki

@Entity()
export class Decks {
  @primary({ autoincrement: true }) id!: number
  @prop({ unique: true }) name!: string
}

export const dbDecks = new Table(Decks)

@Entity()
export class Models {
  @primary({ autoincrement: true }) id!: number
  @prop({ unique: true }) name!: string
  @prop<string[]>({
    type: 'string',
    transform: {
      get: (r: string) => r.split('\x1f'),
      set: (d: string[]) => d.join('\x1f')
    }
  })
  flds!: string[]

  @prop() css!: string
}

export const dbModels = new Table(Models)

@Entity()
export class Templates {
  @primary({ autoincrement: true }) id!: number
  @prop({ references: dbModels, index: true }) mid!: string
  @prop({ index: true }) name!: string
  @prop() qfmt!: string
  @prop() afmt!: string
}

export const dbTemplates = new Table(Templates)

// Default tables in Anki

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
  @primary({ default: 1 }) id!: number
  @prop({ default: () => Math.floor(+new Date() / 1000) }) crt!: number
  @prop({ default: () => Math.floor(+new Date()) }) mod!: number
  @prop({ default: 0 }) scm!: number
  @prop({ default: 11 }) ver!: number
  @prop({ default: 0 }) dty!: number
  @prop({ default: 0 }) usn!: number
  @prop({ default: 0 }) ls!: number
  @prop() conf!: Record<string, unknown>
  @prop() models!: Record<string, unknown>
  @prop() decks!: Record<string, unknown>
  @prop() dconf!: Record<string, unknown>
  @prop() tags!: Record<string, unknown>
}

export const dbCol = new Table(Col)
