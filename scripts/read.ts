import { inspect } from 'util'

import { yamprint, YamprintTheme } from 'yamprint'
import chalk from 'chalk'

import { Apkg } from '../src'

const yp = yamprint.extend({
  formatter: Object.entries(inspect.styles).reduce((prev, [k, v]) => ({
    ...prev,
    [k]: (chalk as any)[v]
  }), {
    lineInMultilineBlock: (chalk as any)[inspect.styles.string]
  } as YamprintTheme)
})

inspect.defaultOptions.breakLength = Infinity
inspect.defaultOptions.compact = false

;(async () => {
  const apkg = await Apkg.connect('/Users/patarapolw/Downloads/Hanyu_Shuiping_Kaoshi_HSK_all_5000_words_high_quality.apkg')

  await apkg.anki2.each((result) => {
    console.log(yp(result))
  }, {}, { limit: 2 })

  await apkg.cleanup()
})().catch(console.error)
