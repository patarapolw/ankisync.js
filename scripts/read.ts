import { pp } from '@patarapolw/prettyprint'

import { Apkg } from '../src'

;(async () => {
  const apkg = await Apkg.connect('/Users/patarapolw/Downloads/Hanyu_Shuiping_Kaoshi_HSK_all_5000_words_high_quality.apkg')

  pp(await apkg.anki2.find({}))

  await apkg.cleanup()
})().catch(console.error)
