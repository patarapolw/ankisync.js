import { primary, prop, Entity, Table } from 'liteorm'

/**
 * col contains a single row that holds various information about the collection
 */
@Entity({ name: 'col' })
class AnkiCol {
  /**
   * arbitrary number since there is only one row
   */
  @primary({ autoincrement: true }) id?: number
  /**
   * created timestamp
   */
  @prop({ type: 'int', default: () => +new Date() }) crt?: number

  /**
   * last modified in milliseconds
   */
  @prop({
    type: 'int',
    default: () => +new Date(),
    onUpdate: () => +new Date()
  }) mod?: number

  /**
   * schema mod time: time when "schema" was modified.
   *
   * If server scm is different from the client scm a full-sync is required
   */
  @prop({ type: 'int', default: () => +new Date() }) scm?: number
  /**
   * version
   */
  @prop({ type: 'int', default: 11 }) ver?: number
  /**
   * dirty: unused, set to 0
   */
  @prop({ type: 'int', default: 0 }) dty?: number
  /**
   * update sequence number: used for finding diffs when syncing.
   * See usn in cards table for more details.
   */
  @prop({ type: 'int', default: 0 }) usn?: number
  /**
   * "last sync time"
   */
  @prop({ type: 'int', default: 0 }) ls?: number
  /**
   * json object containing configuration options that are synced
   */
  @prop({
    default: () => ({
      nextPos: 1,
      estTimes: true,
      sortBackwards: false,
      sortType: 'noteFld',
      timeLim: 0,
      activeDecks: [
        1
      ],
      addToCur: true,
      curDeck: 1,
      curModel: '1540966298474',
      collapseTime: 1200,
      activeCols: [
        'noteFld',
        'template',
        'cardDue',
        'deck'
      ],
      savedFilters: {},
      dueCounts: true,
      newBury: true,
      newSpread: 0
    })
  }) conf?: Record<string, any>

  /**
   * json array of json objects containing the models (aka Note types)
   */
  @prop({ default: () => ({}) }) models?: {
    [mid: string]: Record<string, any>
  }

  /**
   * json array of json objects containing the deck
   */
  @prop({ default: () => ({}) }) decks?: {
    [did: string]: Record<string, any>
  }

  /**
   * json array of json objects containing the deck options
   */
  @prop({
    default: () => ({
      1: {
        name: 'Default',
        replayq: true,
        lapse: {
          leechFails: 8,
          minInt: 1,
          delays: [
            10
          ],
          leechAction: 0,
          mult: 0
        },
        rev: {
          perDay: 200,
          ivlFct: 1,
          maxIvl: 36500,
          minSpace: 1,
          ease4: 1.3,
          bury: false,
          fuzz: 0.05
        },
        timer: 0,
        maxTaken: 60,
        usn: 0,
        new: {
          separate: true,
          delays: [
            1,
            10
          ],
          perDay: 20,
          ints: [
            1,
            4,
            7
          ],
          initialFactor: 2500,
          bury: false,
          order: 1
        },
        autoplay: true,
        id: 1,
        mod: 0
      }
    })
  }) dconf?: Record<string, any>

  /**
   * a cache of tags used in the collection (This list is displayed in the browser. Potentially at other place)
   */
  @prop({ default: () => ({}) }) tags?: Record<string, any>
}

export const ankiCol = new Table(AnkiCol)
