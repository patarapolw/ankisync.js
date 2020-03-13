import path from 'path'
import crypto from 'crypto'

import fs from 'fs-extra'
import AdmZip from 'adm-zip'
import rimraf from 'rimraf'
import knex from 'knex'

import { mapAsync } from './utils'

export class Anki2 {
  public static async connect (colPath: string) {
    const db = knex({
      client: 'sqlite3',
      connection: {
        filename: colPath
      },
      useNullAsDefault: true
    })

    if (!(await db.schema.hasTable('decks'))) {
      await mapAsync(/*sql*/`
        CREATE TABLE IF NOT EXISTS decks (
          id      INTEGER PRIMARY KEY,
          [name]  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS media (
          id      INTEGER PRIMARY KEY,
          [name]  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS models (
          id      INTEGER PRIMARY KEY,
          [name]  TEXT NOT NULL,
          flds    TEXT NOT NULL,  -- \x1f field
          css     TEXT
        );

        CREATE TABLE IF NOT EXISTS templates (
          mid     INTEGER NOT NULL REFERENCES models(id),
          ord     INTEGER NOT NULL,
          [name]  TEXT NOT NULL,
          qfmt    TEXT NOT NULL,
          afmt    TEXT
        )
      `.split(';'), async (el) => db.raw(el))

      const { decks, models } = await db.select('decks', 'models').from('col').first()

      await mapAsync(Object.values(JSON.parse(decks)), async (d: any) => {
        console.log(d)
        return await db('decks').insert({
          id: parseInt(d.id),
          name: d.name
        })
      })

      await mapAsync(Object.values(JSON.parse(models)), async (m: any) => {
        await db('models').insert({
          id: parseInt(m.id),
          name: m.name,
          flds: m.flds.map((f: any) => f.name).join('\x1f'),
          css: m.css
        })

        await mapAsync(m.tmpls, async (t: any, i: number) => {
          await db('templates').insert({
            mid: parseInt(m.id),
            ord: i,
            name: t.name,
            qfmt: t.qfmt,
            afmt: t.afmt
          })
        })
      })
    }

    return new Anki2({ colPath, db })
  }

  db: knex
  colPath: string;

  private constructor (params: { colPath: string, db: knex }) {
    this.db = params.db
    this.colPath = params.colPath
  }

  async find (filter: any = {}, options: {
    offset?: number
    limit?: number
    sort?: {
      key: string
      desc?: boolean
    }
  } = {}): Promise<{
    deck: string;
    values: string[];
    keys: string[];
    css: string | null;
    qfmt: string;
    afmt: string | null;
    template: string;
    model: string;
  }[]> {
    return (
      await this.db
        .select(
          this.db.ref('d.name').as('deck'),
          this.db.ref('n.flds').as('values'),
          this.db.ref('m.flds').as('keys'),
          this.db.ref('m.css').as('css'),
          this.db.ref('t.qfmt').as('qfmt'),
          this.db.ref('t.afmt').as('afmt'),
          this.db.ref('t.name').as('template'),
          this.db.ref('m.name').as('model')
        )
        .from('cards AS c')
        .join('notes AS n', 'c.nid', 'n.id')
        .join('decks AS d', 'c.did', 'd.id')
        .join('models AS m', 'n.mid', 'm.id')
        .join('templates AS t', function () {
          this.on('t.mid', 'n.mid').andOn('t.ord', 'c.ord')
        })
        .where(filter)
    ).map((el) => {
      el.keys = el.keys.split('\x1f')
      el.values = el.values.split('\x1f')

      return el
    })
  }

  async finalize () {
    const { models, decks } = await this.db.select('models', 'decks').from('col').first()
    const ms = JSON.parse(models)
    const ds = JSON.parse(decks)

    await mapAsync(await this.db.select('id', 'name', 'flds', 'css').from('models'), async (m: any) => {
      const ts = await this.db.select('name', 'ord', 'qfmt', 'afmt')
        .from('templates')
        .where('mid', '=', m.id)
        .orderBy('ord')

      ms[m.id.toString()] = {
        id: m.id,
        css: m.css,
        flds: m.flds.split('\x1f').map((f: string) => ({
          size: 20,
          name: f,
          media: [],
          rtl: false,
          ord: 0,
          font: 'Arial',
          sticky: false
        })),
        tmpls: ts.map((t) => ({
          afmt: t.afmt || '',
          name: t.name,
          qfmt: t.qfmt,
          did: null,
          ord: t.ord,
          bafmt: '',
          bqfmt: ''
        })),
        vers: [],
        name: m.name,
        tags: [],
        did: 1,
        usn: -1,
        req: [
          [
            0,
            'all',
            [
              0
            ]
          ],
          [
            1,
            'all',
            [
              1,
              2
            ]
          ]
        ],
        sortf: 0,
        latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
        latexPost: '\\end{document}',
        type: 0,
        mod: 1540966298
      }
    });

    (await this.db.select('id', 'name').from('decks')).map((d) => {
      ds[d.id.toString()] = {
        id: d.id,
        name: d.name,
        extendRev: 50,
        usn: 0,
        collapsed: false,
        newToday: [
          0,
          0
        ],
        timeToday: [
          0,
          0
        ],
        dyn: 0,
        extendNew: 10,
        conf: 1,
        revToday: [
          0,
          0
        ],
        lrnToday: [
          0,
          0
        ],
        mod: 1540966298,
        desc: ''
      }
    })

    await this.db('col').update({
      models: JSON.stringify(ms),
      decks: JSON.stringify(ds)
    })

    await this.db.schema.dropTable('templates')
    await this.db.schema.dropTable('models')
    await this.db.schema.dropTable('decks')
  }

  /**
   * There is no need to cleanup as of current.
   */
  async cleanup () {
    await this.db.destroy()
  }
}

export class Apkg {
  static async connect (filePath: string) {
    const p = path.parse(filePath)
    const dir = path.join(p.dir, p.name + '_' + Math.random().toString(36).substr(2))
    fs.ensureDirSync(dir)

    if (fs.existsSync(filePath)) {
      const zip = new AdmZip(filePath)
      zip.extractAllTo(dir)
    }

    const anki2 = await Anki2.connect(path.join(dir, 'collection.anki2'))

    if (fs.existsSync(filePath)) {
      const mediaJson = JSON.parse(fs.readFileSync(path.join(dir, 'media'), 'utf8'))
      await Promise.all(Object.keys(mediaJson).map((k) => {
        const data = fs.readFileSync(path.join(dir, k))

        return anki2.db('media').insert({
          h: crypto.createHash('sha256').update(data).digest('base64'),
          name: mediaJson[k]
        })
      }))
    }

    return new Apkg({ filePath, anki2, dir })
  }

  filePath: string;
  dir: string;
  anki2: Anki2;

  private constructor (params: { filePath: string, anki2: Anki2, dir: string }) {
    this.filePath = params.filePath
    this.anki2 = params.anki2
    this.dir = params.dir
  }

  async finalize (overwrite = true) {
    await this.anki2.finalize()
    const mediaJson = {} as any

    const zip = new AdmZip()
    zip.addLocalFile(path.join(this.dir, 'collection.anki2'));

    (await this.anki2.db.select('id', 'name').from('media')).map((m) => {
      mediaJson[m.id.toString()] = m.name
      zip.addFile(m.name, fs.readFileSync(path.join(this.dir, m.id.toString())))
    })

    zip.addFile('media', Buffer.from(JSON.stringify(mediaJson)))

    await this.anki2.db.schema.dropTable('media')
    await this.anki2.db.destroy()

    if (!overwrite) {
      const originalFilePath = this.filePath

      while (fs.existsSync(this.filePath)) {
        const p = path.parse(originalFilePath)
        this.filePath = p.dir + p.base + '_' + Math.random().toString(36).substr(2) + p.ext
      }
    }

    zip.writeZip(this.filePath)
    rimraf.sync(this.dir)
  }

  /**
   * You will lose any unsaved data.
   *
   * Use #finalize to save data.
   */
  async cleanup () {
    await this.anki2.cleanup()
    rimraf.sync(this.dir)
  }
}
