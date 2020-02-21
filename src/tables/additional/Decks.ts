import { Entity, primary, prop, Table, Db } from 'liteorm'

@Entity({ name: 'decks' })
class AnkiDecks {
  @primary({ autoincrement: true }) id?: number
  @prop() name!: string
}

export const ankiDecks = new Table(AnkiDecks) as Table<AnkiDecks> & {
  toJSON(db: Db, id: number): Promise<Record<string, any> | null>
}

ankiDecks.toJSON = async (db, id) => {
  const r = await db.find(ankiDecks)({ id }, {
    id: ankiDecks.c.id,
    name: ankiDecks.c.name
  }, { limit: 1 })

  if (!r[0]) {
    return null
  }

  return {
    id,
    name: r[0].name,
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
}
