# ankisync.js

Do in Anki what Anki cannot do in JavaScript/TypeScript (Node.js)

## Example

See [/scripts](/scripts)

```ts
(async () => {
  const { anki2 } = await Apkg.connect('foo.apkg')

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

  // r will be strongly typed as well.
  console.log(r)
})().catch(console.error)
```
