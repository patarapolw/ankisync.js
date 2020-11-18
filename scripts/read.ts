import fs from 'fs-extra'

import { dbCards, dbDecks, dbNotes, initDatabase } from '../lib/anki21'
import { getAnkiCollection } from '../lib/dir'

async function main() {
  fs.copyFileSync(getAnkiCollection('User 1'), 'collection.anki2')
  const db = initDatabase('collection.anki2')

  const rs = await db.all(dbNotes, dbCards, dbDecks)(
    {},
    {
      deck: dbDecks.c.name,
      tags: dbNotes.c.tags,
      nid: dbNotes.c.id
    },
    {
      limit: 10
    }
  )

  console.log(rs)
}

if (require.main === module) {
  main().catch(console.error)
}
