"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Apkg = exports.Anki2 = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const rimraf_1 = __importDefault(require("rimraf"));
const sqlite_1 = __importDefault(require("sqlite"));
const sqlite3_1 = require("sqlite3");
const util_1 = require("./util");
class Anki2 {
    constructor(params) {
        this.db = params.db;
        this.colPath = params.colPath;
    }
    static async connect(colPath) {
        const db = await sqlite_1.default.open({ filename: colPath, driver: sqlite3_1.Database });
        const tables = (await db.all(/* sql */ `
      SELECT name FROM sqlite_master WHERE type='table'
    `)).map((t) => t.name);
        if (!tables.includes('deck')) {
            await db.exec(/* sql */ `
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
      `);
            const { decks, models } = await db.get(/* sql */ `
        SELECT decks, models FROM col
      `);
            await util_1.mapAsync(Object.values(JSON.parse(decks)), async (d) => {
                await db.run(
                /* sql */ `
          INSERT INTO decks (id, [name]) VALUES (?, ?)
        `, [parseInt(d.id), d.name]);
            });
            await util_1.mapAsync(Object.values(JSON.parse(models)), async (m) => {
                await db.run(
                /* sql */ `
          INSERT INTO models (id, [name], flds, css)
          VALUES (?, ?, ?, ?)
        `, [
                    parseInt(m.id),
                    m.name,
                    m.flds.map((f) => f.name).join('\x1f'),
                    m.css
                ]);
                await util_1.mapAsync(m.tmpls, async (t, i) => {
                    await db.run(
                    /* sql */ `
            INSERT INTO templates (mid, ord, [name], qfmt, afmt)
            VALUES (?, ?, ?, ?, ?)
          `, [parseInt(m.id), i, t.name, t.qfmt, t.afmt]);
                });
            });
        }
        return new Anki2({ colPath, db });
    }
    async find(where, postfix) {
        return (await this.db.all(/* sql */ `
      SELECT
        d.name AS deck,
        n.flds AS [values],
        m.flds AS keys,
        m.css AS css,
        t.qfmt AS qfmt,
        t.afmt AS afmt,
        t.name AS template,
        m.name AS model
      FROM cards AS c
      JOIN notes AS n ON c.nid = n.id
      JOIN decks AS d ON c.did = d.id
      JOIN models AS m ON n.mid = m.id
      JOIN templates AS t ON t.ord = c.ord AND t.mid = n.mid
      ${where ? `WHERE ${where}` : ''}
      ${postfix || ''}
    `)).map((el) => {
            el.keys = el.keys.split('\x1f');
            el.values = el.values.split('\x1f');
            return el;
        });
    }
    async finalize() {
        const { models, decks } = await this.db.get(/* sql */ `
      SELECT models, decks FROM col
    `);
        const ms = JSON.parse(models);
        const ds = JSON.parse(decks);
        await util_1.mapAsync(await this.db.all(/* sql */ `
      SELECT id, [name], flds, css FROM models
    `), async (m) => {
            const ts = await this.db.all(
            /* sql */ `
        SELECT [name], ord, qfmt, afmt FROM templates
        WHERE mid = ? ORDER BY ord
      `, [m.id]);
            ms[m.id.toString()] = {
                id: m.id,
                css: m.css,
                flds: m.flds.split('\x1f').map((f) => ({
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
                    [0, 'all', [0]],
                    [1, 'all', [1, 2]]
                ],
                sortf: 0,
                latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
                latexPost: '\\end{document}',
                type: 0,
                mod: 1540966298
            };
        });
        (await this.db.all(/* sql */ `
      SELECT id, [name] FROM decks
    `)).map((d) => {
            ds[d.id.toString()] = {
                id: d.id,
                name: d.name,
                extendRev: 50,
                usn: 0,
                collapsed: false,
                newToday: [0, 0],
                timeToday: [0, 0],
                dyn: 0,
                extendNew: 10,
                conf: 1,
                revToday: [0, 0],
                lrnToday: [0, 0],
                mod: 1540966298,
                desc: ''
            };
        });
        await this.db.run(
        /* sql */ `
      UPDATE col
      SET models = ?, decks = ?
    `, [JSON.stringify(ms), JSON.stringify(ds)]);
        await this.db.exec(/* sql */ `
      DROP TABLE templates;
      DROP TABLE models;
      DROP TABLE decks;
    `);
    }
    async cleanup() {
        await this.db.close();
    }
}
exports.Anki2 = Anki2;
class Apkg {
    constructor(params) {
        this.filePath = params.filePath;
        this.anki2 = params.anki2;
        this.dir = params.dir;
    }
    static async connect(filePath) {
        const p = path_1.default.parse(filePath);
        const dir = path_1.default.join(p.dir, p.name + '_' + Math.random().toString(36).substr(2));
        fs_extra_1.default.ensureDirSync(dir);
        if (fs_extra_1.default.existsSync(filePath)) {
            const zip = new adm_zip_1.default(filePath);
            zip.extractAllTo(dir);
        }
        const anki2 = await Anki2.connect(path_1.default.join(dir, 'collection.anki2'));
        if (fs_extra_1.default.existsSync(filePath)) {
            const mediaJson = JSON.parse(fs_extra_1.default.readFileSync(path_1.default.join(dir, 'media'), 'utf8'));
            await Promise.all(Object.keys(mediaJson).map((k) => {
                const data = fs_extra_1.default.readFileSync(path_1.default.join(dir, k));
                anki2.db.run(
                /* sql */ `
          INSERT INTO media (h, [name])
          VALUES (?, ?)
        `, [
                    crypto_1.default.createHash('sha256').update(data).digest('base64'),
                    mediaJson[k]
                ]);
            }));
        }
        return new Apkg({ filePath, anki2, dir });
    }
    async finalize(overwrite = true) {
        await this.anki2.finalize();
        const mediaJson = {};
        const zip = new adm_zip_1.default();
        zip.addLocalFile(path_1.default.join(this.dir, 'collection.anki2'));
        (await this.anki2.db.all(/* sql */ `
      SELECT id, [name] FROM media
    `)).map((m) => {
            mediaJson[m.id.toString()] = m.name;
            zip.addFile(m.name, fs_extra_1.default.readFileSync(path_1.default.join(this.dir, m.id.toString())));
        });
        zip.addFile('media', Buffer.from(JSON.stringify(mediaJson)));
        await this.anki2.db.close();
        if (!overwrite) {
            const originalFilePath = this.filePath;
            while (fs_extra_1.default.existsSync(this.filePath)) {
                const p = path_1.default.parse(originalFilePath);
                this.filePath =
                    p.dir + p.base + '_' + Math.random().toString(36).substr(2) + p.ext;
            }
        }
        zip.writeZip(this.filePath);
        rimraf_1.default.sync(this.dir);
    }
    /**
     * You will lose any unsaved data.
     *
     * Use #finalize to save data.
     */
    async cleanup() {
        await this.anki2.cleanup();
        rimraf_1.default.sync(this.dir);
    }
}
exports.Apkg = Apkg;
//# sourceMappingURL=index.js.map