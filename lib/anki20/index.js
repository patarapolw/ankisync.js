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
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbCol = exports.Col = exports.dbTemplates = exports.Templates = exports.dbModels = exports.Models = exports.dbDecks = exports.Decks = void 0;
const liteorm_1 = require("liteorm");
// Missing tables in Anki
let Decks = class Decks {
};
__decorate([
    liteorm_1.primary({ autoincrement: true }),
    __metadata("design:type", Number)
], Decks.prototype, "id", void 0);
__decorate([
    liteorm_1.prop({ unique: true }),
    __metadata("design:type", String)
], Decks.prototype, "name", void 0);
Decks = __decorate([
    liteorm_1.Entity()
], Decks);
exports.Decks = Decks;
exports.dbDecks = new liteorm_1.Table(Decks);
let Models = class Models {
};
__decorate([
    liteorm_1.primary({ autoincrement: true }),
    __metadata("design:type", Number)
], Models.prototype, "id", void 0);
__decorate([
    liteorm_1.prop({ unique: true }),
    __metadata("design:type", String)
], Models.prototype, "name", void 0);
__decorate([
    liteorm_1.prop({
        type: 'string',
        transform: {
            get: (r) => r.split('\x1f'),
            set: (d) => d.join('\x1f')
        }
    }),
    __metadata("design:type", Array)
], Models.prototype, "flds", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", String)
], Models.prototype, "css", void 0);
Models = __decorate([
    liteorm_1.Entity()
], Models);
exports.Models = Models;
exports.dbModels = new liteorm_1.Table(Models);
let Templates = class Templates {
};
__decorate([
    liteorm_1.primary({ autoincrement: true }),
    __metadata("design:type", Number)
], Templates.prototype, "id", void 0);
__decorate([
    liteorm_1.prop({ references: exports.dbModels, index: true }),
    __metadata("design:type", String)
], Templates.prototype, "mid", void 0);
__decorate([
    liteorm_1.prop({ index: true }),
    __metadata("design:type", String)
], Templates.prototype, "name", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", String)
], Templates.prototype, "qfmt", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", String)
], Templates.prototype, "afmt", void 0);
Templates = __decorate([
    liteorm_1.Entity()
], Templates);
exports.Templates = Templates;
exports.dbTemplates = new liteorm_1.Table(Templates);
// Default tables in Anki
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
    liteorm_1.prop({ default: () => Math.floor(+new Date() / 1000) }),
    __metadata("design:type", Number)
], Col.prototype, "crt", void 0);
__decorate([
    liteorm_1.prop({ default: () => Math.floor(+new Date()) }),
    __metadata("design:type", Number)
], Col.prototype, "mod", void 0);
__decorate([
    liteorm_1.prop({ default: 0 }),
    __metadata("design:type", Number)
], Col.prototype, "scm", void 0);
__decorate([
    liteorm_1.prop({ default: 11 }),
    __metadata("design:type", Number)
], Col.prototype, "ver", void 0);
__decorate([
    liteorm_1.prop({ default: 0 }),
    __metadata("design:type", Number)
], Col.prototype, "dty", void 0);
__decorate([
    liteorm_1.prop({ default: 0 }),
    __metadata("design:type", Number)
], Col.prototype, "usn", void 0);
__decorate([
    liteorm_1.prop({ default: 0 }),
    __metadata("design:type", Number)
], Col.prototype, "ls", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", Object)
], Col.prototype, "conf", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", Object)
], Col.prototype, "models", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", Object)
], Col.prototype, "decks", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", Object)
], Col.prototype, "dconf", void 0);
__decorate([
    liteorm_1.prop(),
    __metadata("design:type", Object)
], Col.prototype, "tags", void 0);
Col = __decorate([
    liteorm_1.Entity()
], Col);
exports.Col = Col;
exports.dbCol = new liteorm_1.Table(Col);
//# sourceMappingURL=index.js.map