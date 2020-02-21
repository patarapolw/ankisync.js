import crypto from 'crypto'

import { primary, Entity, prop, Table } from 'liteorm'
import shortid from 'shortid'
import htmlToText from 'html-to-text'

import { ankiModels } from '../additional/Models'

/**
 * Notes contain the raw information that is formatted into a number of cards
 * according to the models
 */
@Entity({ name: 'notes' })
class AnkiNotes {
  /**
   * epoch seconds of when the note was created
   */
  @primary({ autoincrement: true }) id?: number
  /**
   * globally unique id, almost certainly used for syncing
   */
  @prop({ default: () => shortid.generate() }) guid?: string
  /**
   * model id
   * REFERENCES models(id) in Col#models JSON
   */
  @prop({ references: ankiModels }) mid!: number

  /**
   * modificaton time as epoch seconds
   */
  @prop({
    type: 'int',
    default: () => +new Date() / 1000,
    onUpdate: () => +new Date() / 1000
  }) mod?: number

  /**
   * update sequence number: for finding diffs when syncing.
   * See the description in the cards table for more info
   */
  @prop({ type: 'int', default: -1, index: 'ix_notes_usn' }) usn?: number

  /**
   * space-separated string of tags.
   * includes space at the beginning and end, for LIKE "% tag %" queries
   */
  @prop({
    type: 'str',
    transform: {
      get: (repr) => repr ? repr.trim().split(' ').filter((s: string) => s) : null,
      set: (d) => d ? ` ${d.join(' ')} ` : null
    }
  }) tag!: string[]

  /**
   * the values of the fields in this note. separated by 0x1f (31) character.
   */
  @prop({
    type: 'str',
    transform: {
      get: (repr) => repr ? repr.split('\x1f') : null,
      set: (d) => d ? d.join('\x1f') : null
    }
  }) flds!: string[]

  /**
   * sort field: used for quick sorting and duplicate check
   */
  @prop() sfld?: string

  /**
   * field checksum used for duplicate check.
   * integer representation of first 8 digits of sha1 hash of the first field
   */
  @prop({ type: 'int', index: 'ix_notes_csum' }) csum?: number

  /**
   * unused
   */
  @prop({ type: 'int', default: 0 }) flags?: number

  /**
   * unused
   */
  @prop({ default: '' }) data?: string
}

export const ankiNotes = new Table(AnkiNotes)

ankiNotes.on('pre-update', ({ set }) => {
  if (set.flds) {
    set.sfld = htmlToText.fromString(set.flds[0])

    const shaSum = crypto.createHash('sha1')
    shaSum.update(set.sfld)
    set.csum = parseInt(shaSum.digest('hex').substr(0, 8), 16)
  }
})
