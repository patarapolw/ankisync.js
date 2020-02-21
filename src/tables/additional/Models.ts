import { primary, Entity, prop, Table, Db } from 'liteorm'
import { dbTemplates } from './Templates'

@Entity({ name: 'models' })
class DbModels {
  @primary({ autoincrement: true }) id?: number
  @prop() name!: string

  /**
   * Splitted by '\x1f'
   */
  @prop({
    type: 'string',
    transform: {
      set: (flds) => flds ? flds.join('\x1f') : null,
      get: (repr) => repr ? repr.split('\x1f') : null
    }
  }) flds!: string[]

  @prop({ null: true }) css?: string
}

export const dbModels = new Table(DbModels) as Table<DbModels> & {
  toJSON(db: Db, id: number): Promise<Record<string, any> | null>
}

/**
 * ```
 * {
 *   "model id (epoch time in milliseconds)" : {
 *     css : "CSS, shared for all templates",
 *     did : "Long specifying the id of the deck that cards are added to by default",
 *     flds : [
 *       "JSONArray containing object for each field in the model as follows:",
 *       {
 *         font : "display font",
 *         media : "array of media. appears to be unused",
 *         name : "field name",
 *         ord : "ordinal of the field - goes from 0 to num fields -1",
 *         rtl : "boolean, right-to-left script",
 *         size : "font size",
 *         sticky : "sticky fields retain the value that was last added when adding new notes"
 *       }
 *     ],
 *     id : "model ID, matches notes.mid",
 *     latexPost : "String added to end of LaTeX expressions (usually \\end{document})",
 *     latexPre : "preamble for LaTeX expressions",
 *     mod : "modification time in seconds",
 *     name : "model name"
 *     req : [
 *       "Array of arrays describing, for each template T, which fields are required to generate T.
 *       The array is of the form [T,string,list], where:
 *       -  T is the ordinal of the template.
 *       - The string is 'none', 'all' or 'any'.
 *       - The list contains ordinal of fields, in increasing order.
 *
 *       The meaning is as follows:
 *       - if the string is 'none', then no cards are generated for this template. The list should be empty.
 *       - if the string is 'all' then the card is generated only if each field of the list are filled
 *       - if the string is 'any', then the card is generated if any of the field of the list is filled.
 *
 *       The algorithm to decide how to compute req from the template is explained on:
 *       https://github.com/Arthur-Milchior/anki/blob/commented/documentation//templates_generation_rules.md"
 *     ],
 *     sortf : "Integer specifying which field is used for sorting in the browser",
 *     tags : "Anki saves the tags of the last added note to the current model, use an empty array []",
 *     tmpls : [
 *       "JSONArray containing object of CardTemplate for each card in model",
 *     ],
 *     type : "Integer specifying what type of model. 0 for standard, 1 for cloze",
 *     usn : "usn: Update sequence number: used in same way as other usn vales in db",
 *     vers : "Legacy version number (unused), use an empty array []"
 *   }
 * }
 * ```
 */
dbModels.toJSON = async (db, id) => {
  const r = await db.find(dbModels)({ id }, {
    id: dbModels.c.id,
    css: dbModels.c.css,
    flds: dbModels.c.flds,
    name: dbModels.c.name
  }, { limit: 1 })

  if (!r[0]) {
    return null
  }

  const tmpls = await db.find(dbTemplates)({ mid: id }, {
    mid: dbTemplates.c.mid,
    afmt: dbTemplates.c.afmt,
    qfmt: dbTemplates.c.qfmt
  }, {
    sort: { key: dbTemplates.c.ord }
  })

  return {
    id: r[0].id,
    css: r[0].css,
    flds: r[0].flds.map((f: string) => ({
      size: 20,
      name: f,
      media: [],
      rtl: false,
      ord: 0,
      font: 'Arial',
      sticky: false
    })),
    tmpls: tmpls.map((t) => ({
      afmt: t.afmt || '',
      name: t.name,
      qfmt: t.qfmt,
      did: null,
      ord: t.ord,
      bafmt: '',
      bqfmt: ''
    })),
    vers: [],
    name: r[0].name,
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
}
