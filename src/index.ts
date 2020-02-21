import path from 'path'

import fs from 'fs-extra'
import AdmZip from 'adm-zip'
import SparkMD5 from 'spark-md5'
import rimraf from 'rimraf'
import { Db } from 'liteorm'
import { dbCol, dbNotes, dbCards, dbRevlog, dbGraves, dbDecks, dbModels, dbTemplates, dbMedia } from './tables'
import shortid from 'shortid'

export class Anki2 {
  public static async connect (colPath: string) {
    const db = await Db.connect(colPath)
    const tables = await db.sql.all("SELECT name FROM sqlite_master WHERE type='table'")

    if (!tables.some((t) => t.name === 'col')) {
      await db.init([dbCol, dbNotes, dbCards, dbRevlog, dbGraves])
    }

    if (!tables.some((t) => t.name === 'deck')) {
      await db.init([dbDecks, dbModels, dbTemplates, dbMedia])

      const { decks, models } = (await db.find(dbCol)({}, {
        decks: dbCol.c.decks,
        models: dbCol.c.models
      }, { limit: 1 }))[0]

      await Promise.all(Object.values(decks).map((d: any) => {
        return db.create(dbDecks)({
          id: parseInt(d.id),
          name: d.name
        })
      }))

      await Promise.all(Object.values(models).map(async (model: any) => {
        await db.create(dbModels)({
          id: parseInt(model.id),
          name: model.name,
          flds: model.flds.map((f: any) => f.name),
          css: model.css
        })

        return await Promise.all(model.tmpls.map((t: any, i: number) => {
          return db.create(dbTemplates)({
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
    const col = await this.db.find(dbCol)({}, {
      models: dbCol.c.models,
      decks: dbCol.c.decks
    }, { limit: 1 })

    const { models, decks } = col[0]

    await Promise.all([
      (async () => {
        await Promise.all((await this.db.find(dbModels)({}, {
          id: dbModels.c.id
        })).map(async (m) => {
          models[m.id.toString()] = await dbModels.toJSON(this.db, m.id)
        }))
      })().catch(console.error),
      (async () => {
        await Promise.all((await this.db.find(dbDecks)({}, {
          id: dbDecks.c.id
        })).map(async (d) => {
          decks[d.id.toString()] = await dbDecks.toJSON(this.db, d.id)
        }))
      })().catch(console.error)
    ])

    await this.db.update(dbCol)({}, {
      models,
      decks
    })
  }
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

        return anki2.db.create(dbMedia)({
          h: SparkMD5.ArrayBuffer.hash(data),
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

    ;(await this.anki2.db.find(dbModels)({}, {
      id: dbMedia.c.id,
      name: dbMedia.c.name,
      data: dbMedia.c.data
    })).map((m) => {
      mediaJson[m.id.toString()] = m.name
      zip.addFile(m.name, m.data)
    })

    zip.addFile('media', Buffer.from(JSON.stringify(mediaJson)))

    if (!overwrite && fs.existsSync(this.filePath)) {
      const p = path.parse(this.filePath)
      this.filePath = p.dir + p.base + shortid.generate() + p.ext
    }

    zip.writeZip(this.filePath)
    rimraf.sync(this.dir)
  }
}
