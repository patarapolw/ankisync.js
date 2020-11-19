// import fs from 'fs-extra'

import { dbCards, dbDecks, dbNotes, initDatabase } from '../lib/anki21'
import { ankiconnect } from '../lib/ankiconnect'
// import { getAnkiCollection } from '../lib/dir'

async function main() {
  // fs.copyFileSync(getAnkiCollection('User 1'), 'collection.anki2')
  const db = initDatabase('collection.anki2')
  // db.on('find-sql', console.log)

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
        deck: { $like: 'ZhLevel%', $collate: 'binary' }
      },
      {
        deck: dbDecks.c.name,
        tags: dbNotes.c.tags,
        nid: dbNotes.c.id
      }
    )
    .then((rs) =>
      rs.map((r) => {
        const [type, level, ...tags] = r.deck.split('\x1f').reverse()
        tags.push(`${type}_${level.replace(/ /g, '_')}`)
        tags.pop()

        tags.map((t) => {
          dMap.set(t, [...(dMap.get(t) || []), r.nid])
        })
      })
    )

  for (const [t, notes] of dMap) {
    ankiconnect.invoke('addTags', {
      notes,
      tags: t
    })
  }

  await db.close()
}

if (require.main === module) {
  main().catch(console.error)
}
