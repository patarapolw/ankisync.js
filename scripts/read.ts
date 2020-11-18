import fs from 'fs-extra'

import { dbCards, dbDecks, dbNotes, initDatabase } from '../lib/anki21'
import { getAnkiCollection } from '../lib/dir'

async function main() {
  fs.copyFileSync(getAnkiCollection('User 1'), 'collection.anki2')
  const db = initDatabase('collection.anki2')

  const dMap = new Map<string, number[]>()

  await db
    .all(
      dbNotes,
      {
        from: dbNotes.c.id,
        to: dbCards.c.nid
      },
      {
        from: dbCards.c.did,
        to: dbDecks.c.id
      }
    )(
      {
        tags: { $like: '%zhlevel%' }
      },
      {
        deck: dbDecks.c.name,
        tags: dbNotes.c.tags,
        nid: dbNotes.c.id
      }
    )
    .then((rs) =>
      rs.map((r) => {
        dMap.set(r.deck, [...(dMap.get(r.deck) || []), r.nid])
      })
    )

  console.log(dMap)

  await db.close()
}

if (require.main === module) {
  main().catch(console.error)
}
