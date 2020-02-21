import { Entity, primary, prop, Table } from 'liteorm'
import { dbCards } from './Cards'

/**
 * revlog is a review history; it has a row for every review you've ever done!
 *
 * Is null in <https://github.com/patarapolw/ankisync/blob/master/dev/sample.json>
 */
@Entity({ name: 'revlog' })
class DbRevlog {
  /**
   * epoch-milliseconds timestamp of when you did the review
   */
  @primary({ autoincrement: true }) id?: number

  /**
   * cards.id
   */
  @prop({ type: 'int', references: dbCards, index: 'ix_revlog_cid' }) cid?: number

  /**
   * update sequence number: for finding diffs when syncing.
   * See the description in the cards table for more info
   */
  @prop({ type: 'int', index: 'ix_revlog_usn' }) usn?: number
  /**
   * ```
   * which button you pushed to score your recall.
   * review:  1(wrong), 2(hard), 3(ok), 4(easy)
   * learn/relearn:   1(wrong), 2(ok), 3(easy)
   * ```
   */
  @prop({ type: 'int' }) ease?: number
  /**
   * interval (i.e. as in the card table)
   */
  @prop({ type: 'int' }) ivl?: number
  /**
   * last interval (i.e. the last value of ivl. Note that this value is not necessarily equal to
   * the actual interval between this review and the preceding review)
   */
  @prop({ type: 'int' }) lastIvl?: number
  /**
   * factor
   */
  @prop({ type: 'int' }) factor?: number
  /**
   * how many milliseconds your review took, up to 60000 (60s)
   */
  @prop({ type: 'int' }) time?: number
  /**
   * 0=learn, 1=review, 2=relearn, 3=cram
   */
  @prop({ type: 'int' }) type?: number
}

export const dbRevlog = new Table(DbRevlog)
