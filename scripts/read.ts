import { Apkg } from '../src'
import { ankiCards, ankiNotes, ankiDecks, ankiModels, ankiTemplates } from '../lib'

(async () => {
  const { anki2 } = await Apkg.connect('/Users/patarapolw/Downloads/Hanyu_Shuiping_Kaoshi_HSK_all_5000_words_high_quality.apkg')

  const r = await anki2.db.find(
    ankiCards,
    {
      to: ankiNotes,
      from: ankiCards.c.nid
    },
    {
      to: ankiDecks,
      from: ankiCards.c.did
    },
    {
      to: ankiModels,
      from: ankiNotes.c.mid
    },
    {
      to: ankiTemplates,
      cond: 'templates.mid = notes.mid AND templates.ord = cards.ord'
    }
  )({}, {
    deck: ankiDecks.c.name,
    values: ankiNotes.c.flds,
    keys: ankiModels.c.flds,
    css: ankiModels.c.css,
    qfmt: ankiTemplates.c.qfmt,
    afmt: ankiTemplates.c.afmt,
    template: ankiTemplates.c.name,
    model: ankiModels.c.name
  }, { limit: 10, postfix: 'ORDER BY RANDOM()' })

  console.log(r)
})().catch(console.error)
