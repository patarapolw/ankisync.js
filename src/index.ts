import path from 'path'
import crypto from 'crypto'

import fs from 'fs-extra'
import AdmZip from 'adm-zip'
import rimraf from 'rimraf'
import { Db } from 'liteorm'
import shortid from 'shortid'
import { ankiCol, ankiNotes, ankiCards, ankiRevlog, ankiGraves, ankiDecks, ankiModels, ankiTemplates, ankiMedia } from './tables'

export class Anki2 {
  public static async connect (colPath: string) {
    const db = await Db.connect(colPath)
    const tables = await db.sql.all("SELECT name FROM sqlite_master WHERE type='table'")

    if (!tables.some((t) => t.name === 'col')) {
      await db.init([ankiCol, ankiNotes, ankiCards, ankiRevlog, ankiGraves])
    }

    if (!tables.some((t) => t.name === 'decks')) {
      await db.init([ankiDecks, ankiModels, ankiTemplates, ankiMedia])

      const { decks, models } = (await db.find(ankiCol)({}, {
        decks: ankiCol.c.decks,
        models: ankiCol.c.models
      }, { limit: 1 }))[0]

      await Promise.all(Object.values(decks!).map((d) => {
        return db.create(ankiDecks)({
          id: parseInt(d.id),
          name: d.name
        })
      }))

      await Promise.all(Object.values(models!).map(async (model: any) => {
        await db.create(ankiModels)({
          id: parseInt(model.id),
          name: model.name,
          flds: model.flds.map((f: any) => f.name),
          css: model.css
        })

        return await Promise.all(model.tmpls.map((t: any, i: number) => {
          return db.create(ankiTemplates)({
            mid: parseInt(model.id),
            ord: i,
            name: t.name,
            qfmt: t.qfmt,
            afmt: t.afmt
          })
        }))
      }))
    }

    return new Anki2({ colPath, db })
  }

  db: Db
  colPath: string;

  private constructor (params: { colPath: string, db: Db }) {
    this.db = params.db
    this.colPath = params.colPath
  }

  async close () {
    await this.db.close()
  }

  async finalize () {
    const col = await this.db.find(ankiCol)({}, {
      models: ankiCol.c.models,
      decks: ankiCol.c.decks
    }, { limit: 1 })

    const { models, decks } = col[0]

    await Promise.all([
      (async () => {
        await Promise.all((await this.db.find(ankiModels)({}, {
          id: ankiModels.c.id
        })).map(async (m) => {
          const json = await ankiModels.toJSON(this.db, m.id!)
          if (json) {
            models![m.id!.toString()] = json
          }
        }))
      })().catch(console.error),
      (async () => {
        await Promise.all((await this.db.find(ankiDecks)({}, {
          id: ankiDecks.c.id
        })).map(async (d) => {
          const json = await ankiDecks.toJSON(this.db, d.id!)
          if (json) {
            decks![d.id!.toString()] = json
          }
        }))
      })().catch(console.error)
    ])

    await this.db.update(ankiCol)({}, {
      models,
      decks
    })

    // await db.init([ankiDecks, ankiModels, ankiTemplates, ankiMedia])
    await this.db.sql.exec(`
    DROP TABLE templates;
    DROP TABLE models;
    DROP TABLE decks`)
  }

  /**
   * There is no need to cleanup as of current.
   */
  async cleanup () {}
}

export class Apkg {
  static async connect (filePath: string) {
    const p = path.parse(filePath)
    const dir = path.join(p.dir, p.name + '_' + shortid.generate())
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

        return anki2.db.create(ankiMedia)({
          h: crypto.createHash('sha256').update(data).digest('base64'),
          name: mediaJson[k],
          data
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
    zip.addLocalFile(path.join(this.dir, 'collection.anki2'))

    ;(await this.anki2.db.find(ankiModels)({}, {
      id: ankiMedia.c.id,
      name: ankiMedia.c.name,
      data: ankiMedia.c.data
    })).map((m) => {
      mediaJson[m.id!.toString()] = m.name
      const b = Buffer.alloc(m.data.byteLength)
      const bData = Buffer.from(m.data)
      bData.copy(b)
      zip.addFile(m.name, b)
    })

    zip.addFile('media', Buffer.from(JSON.stringify(mediaJson)))

    await this.anki2.db.sql.exec('DROP TABLE media')
    await this.anki2.db.sql.close()

    if (!overwrite && fs.existsSync(this.filePath)) {
      const p = path.parse(this.filePath)
      this.filePath = p.dir + p.base + shortid.generate() + p.ext
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

export * from './tables'
