import fs from 'fs-extra'
import AdmZip from 'adm-zip'
import path from 'path'
import SparkMD5 from 'spark-md5'
import sqlite from 'sqlite'
import rimraf from 'rimraf'

const sql = (s: TemplateStringsArray, ...args: any[]) => s.map((ss, i) => `${ss}${args[i] || ''}`).join('')

export interface IDeck {
    name: string;
}

export interface IModel {
    name: string;
    flds: string[];
    css: string;
}

export interface ITemplate {
    model: IModel;
    name: string;
    qfmt: string;
    afmt: string;
}

export interface IMedia {
    h: string;
    name: string;
    data: ArrayBuffer;
}

export interface INote {
    model: IModel;
    tags: string[];
    flds: string[];
}

export interface ICard {
    note: INote;
    deck: IDeck;
    template: ITemplate;
}

export class Anki2 {
  public static async connect (colPath: string) {
    const db = await sqlite.open(colPath)
    const tables = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table'`)

    if (!tables.some((t) => t.name === 'col')) {
      await db.run(sql`
            -- col contains a single row that holds various information about the collection
            CREATE TABLE col (
                id              integer primary key default 1,
                -- arbitrary number since there is only one row
                crt             integer not null,
                -- created timestamp
                mod             integer not null,
                -- last modified in milliseconds
                scm             integer not null,
                -- schema mod time: time when "schema" was modified.
                --   If server scm is different from the client scm a full-sync is required
                ver             integer not null default 11,
                -- version
                dty             integer not null default 0,
                -- dirty: unused, set to 0
                usn             integer not null default 0,
                -- update sequence number: used for finding diffs when syncing.
                --   See usn in cards table for more details.
                ls              integer not null default 0,
                -- "last sync time"
                conf            text not null,
                -- json object containing configuration options that are synced
                models          text not null,
                -- json array of json objects containing the models (aka Note types)
                decks           text not null,
                -- json array of json objects containing the deck
                dconf           text not null,
                -- json array of json objects containing the deck options
                tags            text not null default '{}'
                -- a cache of tags used in the collection (This list is displayed in the browser. Potentially at other place)
            );`)

      await db.run(sql`
            -- Notes contain the raw information that is formatted into a number of cards
            -- according to the models
            CREATE TABLE notes (
                id              integer primary key autoincrement,
                -- epoch seconds of when the note was created
                guid            text not null unique,
                -- globally unique id, almost certainly used for syncing
                mid             integer not null,
                -- model id
                -- REFERENCES models(id)
                mod             integer not null,
                -- modification timestamp, epoch seconds
                usn             integer not null default -1,
                -- update sequence number: for finding diffs when syncing.
                --   See the description in the cards table for more info
                tags            text not null default '',
                -- space-separated string of tags.
                --   includes space at the beginning and end, for LIKE "% tag %" queries
                flds            text not null default '',
                -- the values of the fields in this note. separated by 0x1f (31) character.
                sfld            text not null,
                -- sort field: used for quick sorting and duplicate check
                csum            integer not null,
                -- field checksum used for duplicate check.
                --   integer representation of first 8 digits of sha1 hash of the first field
                flags           integer not null default 0,
                -- unused
                data            text not null default ''
                -- unused
            );`)

      await db.run(sql`CREATE INDEX ix_notes_usn on notes (usn)`)
      await db.run(sql`CREATE INDEX ix_notes_csum on notes (csum)`)

      await db.run(sql`
            -- Cards are what you review.
            -- There can be multiple cards for each note, as determined by the Template.
            CREATE TABLE cards (
                id              integer primary key,
                -- the epoch milliseconds of when the card was created
                nid             integer not null,
                -- notes.id
                -- REFERENCES notes(id)
                did             integer not null,
                -- deck id (available in col table)
                -- REFERENCES decks(id)
                ord             integer not null,
                -- ordinal : identifies which of the card templates it corresponds to
                --   valid values are from 0 to num templates - 1
                mod             integer not null,
                -- modificaton time as epoch seconds
                usn             integer not null default -1,
                -- update sequence number : used to figure out diffs when syncing.
                --   value of -1 indicates changes that need to be pushed to server.
                --   usn < server usn indicates changes that need to be pulled from server.
                type            integer not null default 0,
                -- 0=new, 1=learning, 2=due, 3=filtered
                queue           integer not null default 0,
                -- -3=sched buried, -2=user buried, -1=suspended,
                -- 0=new, 1=learning, 2=due (as for type)
                -- 3=in learning, next rev in at least a day after the previous review
                due             integer not null,
                -- Due is used differently for different card types:
                --   new: note id or random int
                --   due: integer day, relative to the collection's creation time
                --   learning: integer timestamp
                ivl             integer not null default 0,
                -- interval (used in SRS algorithm). Negative = seconds, positive = days
                factor          integer not null default 0,
                -- factor (used in SRS algorithm)
                reps            integer not null default 0,
                -- number of reviews
                lapses          integer not null default 0,
                -- the number of times the card went from a "was answered correctly"
                --   to "was answered incorrectly" state
                left            integer not null default 0,
                -- of the form a*1000+b, with:
                -- b the number of reps left till graduation
                -- a the number of reps left today
                odue            integer not null default 0,
                -- original due: only used when the card is currently in filtered deck
                odid            integer not null default 0,
                -- original did: only used when the card is currently in filtered deck
                flags           integer not null default 0,
                -- currently unused
                data            text not null default ''
                -- currently unused
            );`)

      await db.run(sql`CREATE INDEX ix_cards_usn on cards (usn)`)
      await db.run(sql`CREATE INDEX ix_cards_nid on cards (nid)`)
      await db.run(sql`CREATE INDEX ix_cards_sched on cards (did, queue, due)`)

      await db.run(sql`
            -- revlog is a review history; it has a row for every review you've ever done!
            CREATE TABLE revlog (
                id              integer primary key,
                -- epoch-milliseconds timestamp of when you did the review
                cid             integer not null,
                -- cards.id
                usn             integer not null default -1,
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
            );`)

      await db.run(sql`CREATE INDEX ix_revlog_usn on revlog (usn)`)
      await db.run(sql`CREATE INDEX ix_revlog_cid on revlog (cid)`)

      await db.run(sql`
            -- Contains deleted cards, notes, and decks that need to be synced.
            -- usn should be set to -1,
            -- oid is the original id.
            -- type: 0 for a card, 1 for a note and 2 for a deck
            CREATE TABLE graves (
                usn             integer not null default -1,
                oid             integer not null,
                type            integer not null
            );`)
    }

    if (!tables.some((t) => t.name === 'deck')) {
      await db.run(sql`
            CREATE TABLE decks (
                id      INTEGER PRIMARY KEY,
                name    VARCHAR NOT NULL
            )`)

      await db.run(sql`
            CREATE TABLE models (
                id      INTEGER PRIMARY KEY,
                name    VARCHAR NOT NULL,
                flds    VARCHAR NOT NULL,
                css     VARCHAR
            )`)

      await db.run(sql`
            CREATE TABLE templates (
                id      INTEGER PRIMARY KEY AUTOINCREMENT,
                mid     INTEGER NOT NULL REFERENCES model(id),
                ord     INTEGER NOT NULL,
                name    VARCHAR NOT NULL,
                qfmt    VARCHAR NOT NULL,
                afmt    VARCHAR
            )`)

      await db.run(sql`
            CREATE TABLE media (
                h       VARCHAR PRIMARY KEY,
                name    VARCHAR NOT NULL,
                data    BLOB NOT NULL
            )`)

      const { decks, models } = await db.get(sql`SELECT decks, models FROM col`)

      await Promise.all(Object.values(JSON.parse(decks)).map((d: any) => {
        return db.run(sql`INSERT INTO decks (id, "name") VALUES (?, ?)`, parseInt(d.id), d.name)
      }))

      await Promise.all(Object.values(JSON.parse(models)).map(async (model: any) => {
        await db.run(sql`INSERT INTO models (id, "name", flds, css) VALUES (?, ?, ?, ?)`,
          parseInt(model.id), model.name, model.flds.map((f: any) => f.name).join('\x1f'), model.css)

        return await Promise.all(model.tmpls.map((t: any, i: number) => {
          return db.run(sql`INSERT INTO templates (mid, ord, "name", qfmt, afmt) VALUES (?, ?, ?, ?, ?)`,
            parseInt(model.id), i, t.name, t.qfmt, t.afmt)
        }))
      }))
    }

    return new Anki2({ colPath, db })
  }

    public db!: sqlite.Database;
    public colPath!: string;

    private constructor (params: any) {
      for (const [k, v] of Object.entries(params)) {
        (this as any)[k] = v
      }
    }

    public async close () {
      await this.db.close()
    }

    public tables = {
      decks: {
        all: async (): Promise<IDeck[]> => {
          return await this.db.all(sql`SELECT "name" FROM decks`)
        },
        get: async (id: number): Promise<IDeck> => {
          return await this.db.get(sql`SELECT "name" FROM decks WHERE id = ?`, id)
        }
      },
      models: {
        get: async (id: number): Promise<IModel> => {
          const el = await this.db.get(sql`SELECT "name", flds, css FROM models WHERE id = ?`, id)
          el.flds = el.flds.split('\x1f')
          return el
        }
      },
      templates: {
        get: async (mid: number, ord: number): Promise<ITemplate> => {
          const el = await this.db.get(sql`
                SELECT "name", qfmt, afmt FROM templates
                WHERE mid = ? AND ord = ?`, mid, ord)
          el.model = await this.tables.models.get(mid)

          return el
        }
      },
      media: {
        all: async (): Promise<IMedia[]> => {
          return await this.db.all(sql`SELECT h, "name", "data" FROM media`)
        }
      },
      col: {},
      notes: {
        get: async (id: number): Promise<INote> => {
          const el = await this.db.get(sql`SELECT mid, tags, flds FROM notes WHERE id = ?`, id)

          el.model = await this.tables.models.get(el.mid)
          // delete el.mid;

          el.tags = el.tags.split(' ')
          el.flds = el.flds.split('\x1f')

          return el
        }
      },
      cards: {
        all: async (): Promise<ICard[]> => {
          return await Promise.all((await this.db.all(sql`SELECT nid, did, ord FROM cards`)).map(async (el) => {
            el.note = await this.tables.notes.get(el.nid)
            delete el.nid

            el.deck = await this.tables.decks.get(el.did)
            delete el.did

            el.template = await this.tables.templates.get(el.note.mid, el.ord)
            delete el.note.mid
            delete el.ord

            // delete el.note.model;

            return el
          }))
        }
      }
    }
}

export class Apkg {
  public static async connect (filePath: string) {
    const p = path.parse(filePath)
    const dir = path.join(p.dir, p.name === p.base ? p.name + '_' : p.name)
    fs.ensureDirSync(dir)

    const zip = new AdmZip(filePath)
    // const zipCount = zip.getEntries().length;

    zip.extractAllTo(dir)

    const anki2 = await Anki2.connect(path.join(dir, 'collection.anki2'))

    const mediaJson = JSON.parse(fs.readFileSync(path.join(dir, 'media'), 'utf8'))
    // const total = Object.keys(mediaJson).length

    await Promise.all(Object.keys(mediaJson).map((k, i) => {
      const data = fs.readFileSync(path.join(dir, k))
      const h = SparkMD5.ArrayBuffer.hash(data)
      const media = {
        name: mediaJson[k],
        data,
        h
      }

      return anki2.db.run(sql`
            INSERT INTO media (h, "name", "data")
            VALUES (?, ?, ?)
            ON CONFLICT DO NOTHING`,
      media.h, media.name, media.data)
    }))

    return new Apkg({ filePath, anki2, dir })
  }

    public filePath!: string;
    public dir!: string;
    public anki2!: Anki2;

    private constructor (params: any) {
      for (const [k, v] of Object.entries(params)) {
        (this as any)[k] = v
      }
    }

    public async close () {
      await this.anki2.close()
      rimraf.sync(this.dir)
    }
}
