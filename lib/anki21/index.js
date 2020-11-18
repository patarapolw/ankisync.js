"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = exports.dbRevlog = exports.Revlog = exports.dbCards = exports.Cards = exports.dbTemplates = exports.Templates = exports.dbTags = exports.Tags = exports.dbNotes = exports.Notes = exports.dbFields = exports.Fields = exports.dbNotetypes = exports.Notetypes = exports.dbGraves = exports.Graves = exports.dbDecks = exports.Decks = exports.dbDeckConfig = exports.DeckConfig = exports.dbConfig = exports.Config = exports.dbCol = exports.Col = void 0;
const liteorm_1 = require("liteorm");
const nanoid_1 = require("nanoid");
const string_strip_html_1 = __importDefault(require("string-strip-html"));
/**
 * col contains a single row that holds various information about the collection
 *
 * ```sql
 * CREATE TABLE col (
        id              integer primary key,
        -- arbitrary number since there is only one row
        crt             integer not null,
        -- created timestamp
        mod             integer not null,
        -- last modified in milliseconds
        scm             integer not null,
        -- schema mod time: time when "schema" was modified.
        --   If server scm is different from the client scm a full-sync is required
        ver             integer not null,
        -- version
        dty             integer not null,
        -- dirty: unused, set to 0
        usn             integer not null,
        -- update sequence number: used for finding diffs when syncing.
        --   See usn in cards table for more details.
        ls              integer not null,
        -- "last sync time"
        conf            text not null,
        -- json object containing configuration options that are synced
        models          text not null,
        -- json array of json objects containing the models (aka Note types)
        decks           text not null,
        -- json array of json objects containing the deck
        dconf           text not null,
        -- json array of json objects containing the deck options
        tags            text not null
        -- a cache of tags used in the collection (This list is displayed in the browser. Potentially at other place)
    );
    ```
 */
let Col = class Col {
};
__decorate([
    liteorm_1.primary({ default: 1 }),
    __metadata("design:type", Number)
], Col.prototype, "id", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: () => Math.floor(+new Date() / 1000) }),
    __metadata("design:type", Number)
], Col.prototype, "crt", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: () => Math.floor(+new Date()) }),
    __metadata("design:type", Number)
], Col.prototype, "mod", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Col.prototype, "scm", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 16 }),
    __metadata("design:type", Number)
], Col.prototype, "ver", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Col.prototype, "dty", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 19 }),
    __metadata("design:type", Number)
], Col.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Col.prototype, "ls", void 0);
__decorate([
    liteorm_1.prop({ default: '' }),
    __metadata("design:type", Object)
], Col.prototype, "conf", void 0);
__decorate([
    liteorm_1.prop({ default: '' }),
    __metadata("design:type", Object)
], Col.prototype, "models", void 0);
__decorate([
    liteorm_1.prop({ default: '' }),
    __metadata("design:type", Object)
], Col.prototype, "decks", void 0);
__decorate([
    liteorm_1.prop({ default: '' }),
    __metadata("design:type", Object)
], Col.prototype, "dconf", void 0);
__decorate([
    liteorm_1.prop({ default: '' }),
    __metadata("design:type", Object)
], Col.prototype, "tags", void 0);
Col = __decorate([
    liteorm_1.Entity()
], Col);
exports.Col = Col;
exports.dbCol = new liteorm_1.Table(Col);
/**
 * json object containing configuration options that are synced
 */
let Config = class Config {
};
__decorate([
    liteorm_1.prop({ index: true }),
    __metadata("design:type", String)
], Config.prototype, "key", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Config.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Config.prototype, "mtimeSec", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", ArrayBuffer)
], Config.prototype, "val", void 0);
Config = __decorate([
    liteorm_1.Entity({ withoutRowID: true })
], Config);
exports.Config = Config;
exports.dbConfig = new liteorm_1.Table(Config);
/**
 * json array of json objects containing the deck options
 */
let DeckConfig = class DeckConfig {
};
__decorate([
    liteorm_1.primary({ autoincrement: true }),
    __metadata("design:type", Number)
], DeckConfig.prototype, "id", void 0);
__decorate([
    liteorm_1.prop({ collate: 'unicase' }),
    __metadata("design:type", String)
], DeckConfig.prototype, "name", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: () => Math.floor(+new Date() / 1000) }),
    __metadata("design:type", Number)
], DeckConfig.prototype, "mtimeSecs", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DeckConfig.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", ArrayBuffer)
], DeckConfig.prototype, "config", void 0);
DeckConfig = __decorate([
    liteorm_1.Entity()
], DeckConfig);
exports.DeckConfig = DeckConfig;
exports.dbDeckConfig = new liteorm_1.Table(DeckConfig);
/**
 * json array of json objects containing the deck options
 */
let Decks = class Decks {
};
__decorate([
    liteorm_1.primary({ autoincrement: true }),
    __metadata("design:type", Number)
], Decks.prototype, "id", void 0);
__decorate([
    liteorm_1.prop({ collate: 'unicase', index: 'idx_decks_name' }),
    __metadata("design:type", String)
], Decks.prototype, "name", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: () => Math.floor(+new Date() / 1000) }),
    __metadata("design:type", Number)
], Decks.prototype, "mtimeSecs", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Decks.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", ArrayBuffer)
], Decks.prototype, "common", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", ArrayBuffer)
], Decks.prototype, "kind", void 0);
Decks = __decorate([
    liteorm_1.Entity()
], Decks);
exports.Decks = Decks;
exports.dbDecks = new liteorm_1.Table(Decks);
/**
 * ```sql
 * -- Contains deleted cards, notes, and decks that need to be synced.
  -- usn should be set to -1,
  -- oid is the original id.
  -- type: 0 for a card, 1 for a note and 2 for a deck
    CREATE TABLE graves (
        usn             integer not null,
        oid             integer not null,
        type            integer not null
    );
 * ```
 */
let Graves = class Graves {
};
__decorate([
    liteorm_1.prop({ type: 'int', default: -1 }),
    __metadata("design:type", Number)
], Graves.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Graves.prototype, "oid", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Graves.prototype, "type", void 0);
Graves = __decorate([
    liteorm_1.Entity()
], Graves);
exports.Graves = Graves;
exports.dbGraves = new liteorm_1.Table(Graves);
let Notetypes = class Notetypes {
};
__decorate([
    liteorm_1.primary({ autoincrement: true }),
    __metadata("design:type", Number)
], Notetypes.prototype, "id", void 0);
__decorate([
    liteorm_1.prop({ collate: 'unicase', index: 'idx_notetypes_name' }),
    __metadata("design:type", String)
], Notetypes.prototype, "name", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: () => Math.floor(+new Date() / 1000) }),
    __metadata("design:type", Number)
], Notetypes.prototype, "mtimeSecs", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0, index: 'idx_notetypes_usn' }),
    __metadata("design:type", Number)
], Notetypes.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", ArrayBuffer)
], Notetypes.prototype, "config", void 0);
Notetypes = __decorate([
    liteorm_1.Entity()
], Notetypes);
exports.Notetypes = Notetypes;
exports.dbNotetypes = new liteorm_1.Table(Notetypes);
// eslint-disable-next-line no-use-before-define
let Fields = class Fields {
};
__decorate([
    liteorm_1.prop({ type: 'int', references: exports.dbNotetypes }),
    __metadata("design:type", Number)
], Fields.prototype, "ntid", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Fields.prototype, "ord", void 0);
__decorate([
    liteorm_1.prop({ collate: 'unicase' }),
    __metadata("design:type", String)
], Fields.prototype, "name", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", ArrayBuffer)
], Fields.prototype, "config", void 0);
Fields = __decorate([
    liteorm_1.Entity({
        primary: ['ntid', 'ord'],
        index: [{ name: 'idx_fields_name_ntid', keys: ['name', 'ntid'] }],
        withoutRowID: true
    })
], Fields);
exports.Fields = Fields;
exports.dbFields = new liteorm_1.Table(Fields);
/**
 * ```sql
 * -- Notes contain the raw information that is formatted into a number of cards
  -- according to the models
  CREATE TABLE notes (
      id              integer primary key,
      -- epoch seconds of when the note was created
      guid            text not null,
      -- globally unique id, almost certainly used for syncing
      mid             integer not null,
      -- model id
      mod             integer not null,
      -- modification timestamp, epoch seconds
      usn             integer not null,
      -- update sequence number: for finding diffs when syncing.
      --   See the description in the cards table for more info
      tags            text not null,
      -- space-separated string of tags.
      --   includes space at the beginning and end, for LIKE "% tag %" queries
      flds            text not null,
      -- the values of the fields in this note. separated by 0x1f (31) character.
      sfld            text not null,
      -- sort field: used for quick sorting and duplicate check
      csum            integer not null,
      -- field checksum used for duplicate check.
      -- integer representation of first 8 digits of sha1 hash of the first field
      flags           integer not null,
      -- unused
      data            text not null
      -- unused
  );
 * ```
 */
let Notes = class Notes {
};
__decorate([
    liteorm_1.primary({ autoincrement: true }),
    __metadata("design:type", Number)
], Notes.prototype, "id", void 0);
__decorate([
    liteorm_1.prop({ unique: true, default: () => nanoid_1.nanoid() }),
    __metadata("design:type", String)
], Notes.prototype, "guid", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', references: exports.dbNotetypes, index: 'idx_notes_mid' }),
    __metadata("design:type", Number)
], Notes.prototype, "mid", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', onChange: () => Math.floor(+new Date()) }),
    __metadata("design:type", Number)
], Notes.prototype, "mod", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: -1, index: 'ix_notes_usn' }),
    __metadata("design:type", Number)
], Notes.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop({
        type: 'string',
        transform: {
            get: (r) => r.split(' ').filter((el) => el),
            set: (d) => d.join(' ')
        },
        default: () => []
    }),
    __metadata("design:type", Array)
], Notes.prototype, "tags", void 0);
__decorate([
    liteorm_1.prop({
        type: 'string',
        transform: {
            get: (r) => r.split('\x1f').filter((el) => el),
            set: (d) => d.join('\x1f')
        }
    }),
    __metadata("design:type", Array)
], Notes.prototype, "flds", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", String)
], Notes.prototype, "sfld", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', index: 'ix_notes_csum' }),
    __metadata("design:type", Number)
], Notes.prototype, "csum", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Notes.prototype, "flags", void 0);
__decorate([
    liteorm_1.prop({ default: '' }),
    __metadata("design:type", String)
], Notes.prototype, "data", void 0);
Notes = __decorate([
    liteorm_1.Entity()
], Notes);
exports.Notes = Notes;
exports.dbNotes = new liteorm_1.Table(Notes);
exports.dbNotes.on('pre-create', (d) => {
    d.entry.sfld = string_strip_html_1.default(d.entry.flds[0]).result;
});
/**
 * Empty table, despite already created some tags
 */
let Tags = class Tags {
};
__decorate([
    liteorm_1.prop({ index: true, collate: 'unicase' }),
    __metadata("design:type", String)
], Tags.prototype, "tag", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Tags.prototype, "usn", void 0);
Tags = __decorate([
    liteorm_1.Entity({ withoutRowID: true })
], Tags);
exports.Tags = Tags;
exports.dbTags = new liteorm_1.Table(Tags);
// eslint-disable-next-line no-use-before-define
let Templates = class Templates {
};
__decorate([
    liteorm_1.prop({ type: 'int', references: exports.dbNotetypes }),
    __metadata("design:type", Number)
], Templates.prototype, "ntid", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Templates.prototype, "ord", void 0);
__decorate([
    liteorm_1.prop({ collate: 'unicase' }),
    __metadata("design:type", String)
], Templates.prototype, "name", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Templates.prototype, "mtimeSecs", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0, index: 'idx_templates_usn' }),
    __metadata("design:type", Number)
], Templates.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", ArrayBuffer)
], Templates.prototype, "config", void 0);
Templates = __decorate([
    liteorm_1.Entity({
        primary: ['ntid', 'ord'],
        index: [
            {
                name: 'idx_templates_name_ntid',
                keys: ['name', 'ntid']
            }
        ],
        withoutRowID: true
    })
], Templates);
exports.Templates = Templates;
exports.dbTemplates = new liteorm_1.Table(Templates);
/**
 * ```sql
 * -- Cards are what you review.
  -- There can be multiple cards for each note, as determined by the Template.
  CREATE TABLE cards (
      id              integer primary key,
      -- the epoch milliseconds of when the card was created
      nid             integer not null,--
      -- notes.id
      did             integer not null,
      -- deck id (available in col table)
      ord             integer not null,
      -- ordinal : identifies which of the card templates it corresponds to
      --   valid values are from 0 to num templates - 1
      mod             integer not null,
      -- modificaton time as epoch seconds
      usn             integer not null,
      -- update sequence number : used to figure out diffs when syncing.
      --   value of -1 indicates changes that need to be pushed to server.
      --   usn < server usn indicates changes that need to be pulled from server.
      type            integer not null,
      -- 0=new, 1=learning, 2=due, 3=filtered
      queue           integer not null,
      -- -3=sched buried, -2=user buried, -1=suspended,
      -- 0=new, 1=learning, 2=due (as for type)
      -- 3=in learning, next rev in at least a day after the previous review
      due             integer not null,
      -- Due is used differently for different card types:
      --   new: note id or random int
      --   due: integer day, relative to the collection's creation time
      --   learning: integer timestamp
      ivl             integer not null,
      -- interval (used in SRS algorithm). Negative = seconds, positive = days
      factor          integer not null,
      -- factor (used in SRS algorithm)
      reps            integer not null,
      -- number of reviews
      lapses          integer not null,
      -- the number of times the card went from a "was answered correctly"
      --   to "was answered incorrectly" state
      left            integer not null,
      -- of the form a*1000+b, with:
      -- b the number of reps left till graduation
      -- a the number of reps left today
      odue            integer not null,
      -- original due: only used when the card is currently in filtered deck
      odid            integer not null,
      -- original did: only used when the card is currently in filtered deck
      flags           integer not null,
      -- currently unused
      data            text not null
      -- currently unused
  );
  ```
 */
// eslint-disable-next-line no-use-before-define
let Cards = class Cards {
};
__decorate([
    liteorm_1.primary({ autoincrement: true }),
    __metadata("design:type", Number)
], Cards.prototype, "id", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', references: exports.dbNotes, index: 'ix_cards_nid' }),
    __metadata("design:type", Number)
], Cards.prototype, "nid", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', references: exports.dbDecks }),
    __metadata("design:type", Number)
], Cards.prototype, "did", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Cards.prototype, "ord", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', onChange: () => Math.floor(+new Date()) }),
    __metadata("design:type", Number)
], Cards.prototype, "mod", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: -1, index: 'ix_cards_usn' }),
    __metadata("design:type", Number)
], Cards.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Cards.prototype, "queue", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Cards.prototype, "due", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Cards.prototype, "ivl", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Cards.prototype, "factor", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Cards.prototype, "reps", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Cards.prototype, "lapses", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Cards.prototype, "left", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Cards.prototype, "odue", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0, index: 'idx_cards_odid' }),
    __metadata("design:type", Number)
], Cards.prototype, "odid", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Cards.prototype, "flags", void 0);
__decorate([
    liteorm_1.prop({ default: '' }),
    __metadata("design:type", String)
], Cards.prototype, "data", void 0);
Cards = __decorate([
    liteorm_1.Entity({
        index: [{ name: 'ix_cards_sched', keys: ['did', 'queue', 'due'] }]
    })
], Cards);
exports.Cards = Cards;
exports.dbCards = new liteorm_1.Table(Cards);
exports.dbCards.on('pre-create', (d) => {
    d.entry.due = d.entry.nid;
});
/**
 * ```sql
 * -- revlog is a review history; it has a row for every review you've ever done!
  CREATE TABLE revlog (
      id              integer primary key,
      -- epoch-milliseconds timestamp of when you did the review
      cid             integer not null,
      -- cards.id
      usn             integer not null,
      -- update sequence number: for finding diffs when syncing.
      --   See the description in the cards table for more info
      ease            integer not null,
      -- which button you pushed to score your recall.
      -- review:  1(wrong), 2(hard), 3(ok), 4(easy)
      -- learn/relearn:   1(wrong), 2(ok), 3(easy)
      ivl             integer not null,
      -- interval
      lastIvl         integer not null,
      -- last interval
      factor          integer not null,
      -- factor
      time            integer not null,
      -- how many milliseconds your review took, up to 60000 (60s)
      type            integer not null
      --  0=learn, 1=review, 2=relearn, 3=cram
  );
 * ```
 */
let Revlog = class Revlog {
};
__decorate([
    liteorm_1.primary({ autoincrement: true }),
    __metadata("design:type", Number)
], Revlog.prototype, "id", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', references: exports.dbCards, index: 'ix_revlog_cid' }),
    __metadata("design:type", Number)
], Revlog.prototype, "cid", void 0);
__decorate([
    liteorm_1.prop({ type: 'int', default: -1, index: 'ix_revlog_usn' }),
    __metadata("design:type", Number)
], Revlog.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Revlog.prototype, "ease", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Revlog.prototype, "ivl", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Revlog.prototype, "lastIvl", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Revlog.prototype, "factor", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Revlog.prototype, "time", void 0);
__decorate([
    liteorm_1.prop({ type: 'int' }),
    __metadata("design:type", Number)
], Revlog.prototype, "type", void 0);
Revlog = __decorate([
    liteorm_1.Entity()
], Revlog);
exports.Revlog = Revlog;
exports.dbRevlog = new liteorm_1.Table(Revlog);
function initDatabase(filename) {
    const db = new liteorm_1.Db(filename);
    return db;
}
exports.initDatabase = initDatabase;
//# sourceMappingURL=index.js.map