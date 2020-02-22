import { Entity, primary, prop, Table } from 'liteorm'

import { ankiNotes } from './Notes'
import { ankiDecks } from '../additional/Decks'

@Entity({
  name: 'cards',
  index: [{
    name: 'ix_cards_sched',
    keys: ['deck', 'queue', 'due']
  }]
})
class AnkiCards {
  /**
   * the epoch milliseconds of when the card was created
   *
   * Note that +new Date() is millseconds, but CURRENT_TIMESTAMP is seconds
   */
  @primary({ autoincrement: true }) id?: number
  /**
   * notes.id
   *
   * Also milliseconds
   */
  @prop({ references: ankiNotes, index: 'ix_cards_nid' }) nid!: number
  /**
   * deck id (available in col table)
   *
   * @default 1
   */
  @prop({ references: ankiDecks, default: 1 }) did!: number
  /**
   * ```
   * Ordinal : identifies which of the card templates or cloze deletions it corresponds to
   *   for card templates, valid values are from 0 to num templates - 1
   *   for cloze deletions, valid values are from 0 to max cloze index - 1
   *   (they're 0 indexed despite the first being called `c1`)
   * ```
   */
  @prop({ type: 'int' }) ord!: number

  /**
   * modificaton time as epoch seconds
   */
  @prop<Date>({
    type: 'int',
    onChange: () => new Date(),
    transform: {
      get: (repr) => repr ? new Date(repr * 1000) : null,
      set: (d) => d ? +d / 1000 : null
    }
  }) mod?: Date

  /**
   * ```
   * update sequence number : used to figure out diffs when syncing.
   *   value of -1 indicates changes that need to be pushed to server.
   *   usn < server usn indicates changes that need to be pulled from server.
   * ```
   */
  @prop({ type: 'int', default: -1, index: 'ix_cards_usn' }) usn?: number
  /**
   * 0=new, 1=learning, 2=due, 3=filtered
   */
  @prop({ type: 'int', default: 0 }) type?: number
  /**
   * ```
   * -3=user buried(In scheduler 2),
   * -2=sched buried (In scheduler 2),
   * -2=buried(In scheduler 1),
   * -1=suspended,
   * 0=new, 1=learning, 2=due (as for type)
   * 3=in learning, next rev in at least a day after the previous review
   * ```
   */
  @prop({ type: 'int', default: 0 }) queue?: number
  /**
   * ```
   * Due is used differently for different card types:
   *   new: note id or random int
   *   due: integer day, relative to the collection's creation time
   *   learning: integer timestamp
   * ```
   */
  @prop({ type: 'int', default: 0 }) due?: number
  /**
   * interval (used in SRS algorithm). Negative = seconds, positive = days
   */
  @prop({ type: 'int', default: 0 }) ivl?: number
  /**
   * The ease factor of the card in permille (parts per thousand). If the ease factor is 2500,
   * the card’s interval will be multiplied by 2.5 the next time you press Good.
   */
  @prop({ type: 'int', default: 2500 }) factor?: number
  /**
   * number of reviews
   */
  @prop({ type: 'int', default: 0 }) reps?: number
  /**
   * the number of times the card went from a "was answered correctly"
   * to "was answered incorrectly" state
   */
  @prop({ type: 'int', default: 0 }) lapses?: number
  /**
   * of the form a*1000+b, with:
   *
   * b the number of reps left till graduation
   * a the number of reps left today
   */
  @prop({ type: 'int', default: 0 }) left?: number
  /**
   * ```
   * original due: In filtered decks, it's the original due date that the card had before moving to filtered.
   * If the card lapsed in scheduler1, then it's the value before the lapse. (This is used when switching to scheduler 2.
   * At this time, cards in learning becomes due again, with their previous due date)
   * In any other case it's 0.
   * ```
   */
  @prop({ type: 'int', default: 0 }) odue?: number
  /**
   * original did: only used when the card is currently in filtered deck
   */
  @prop({ type: 'int', default: 0 }) odid?: number
  /**
   * an integer. This integer mod 8 represents a "flag", which can be see in browser and while reviewing a note.
   *
   * Red 1, Orange 2, Green 3, Blue 4, no flag: 0. This integer divided by 8 represents currently nothing
   */
  @prop({ type: 'int', default: 0 }) flags?: number
  /**
   * currently unused
   */
  @prop({ default: '' }) data?: string
}

export const ankiCards = new Table(AnkiCards)
