import { Apkg } from '../src'
import { dbCards, dbNotes, dbDecks, dbModels } from '../src/tables'

(async () => {
  const apkg = await Apkg.connect('/Users/patarapolw/Downloads/Hanyu_Shuiping_Kaoshi_HSK_all_5000_words_high_quality.apkg')

  console.log(await apkg.anki2.db.find(
    dbCards,
    {
      to: dbNotes,
      from: dbCards.c.nid
    },
    {
      to: dbDecks,
      from: dbCards.c.did
    },
    {
      to: dbModels,
      from: dbNotes.c.mid
    }
  )({}, {
    keys: dbModels.c.flds,
    values: dbNotes.c.flds,
    deck: dbDecks.c.name,
    ord: dbCards.c.ord
  }, { limit: 10, postfix: 'ORDER BY RANDOM()' }))

  await apkg.anki2.db.close()
})().catch(console.error)
