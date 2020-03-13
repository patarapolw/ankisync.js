# ankisync.js

Do in Anki what Anki cannot do in JavaScript/TypeScript (Node.js)

Ankisync.js is powered by [liteorm](https://github.com/patarapolw/liteorm).

## Example

See [/scripts](/scripts)

```ts
import { Apkg, ankiCards, ankiNotes, ankiModels, ankiTemplates, ankiDecks } from 'ankisync'

;(async () => {
  const { anki2 } = await Apkg.connect('foo.apkg')
  const r = await await apkg.anki2.find({})
  console.log(r)
})().catch(console.error)
```
