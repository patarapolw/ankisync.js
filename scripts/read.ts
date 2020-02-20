import { Apkg } from '../src'

;(async () => {
  const apkg = await Apkg.connect('/Users/patarapolw/Downloads/Hanyu_Shuiping_Kaoshi_HSK_all_5000_words_high_quality.apkg')

  console.log(await apkg.anki2.tables.cards.all())

  await apkg.close()
})().catch(console.error)
