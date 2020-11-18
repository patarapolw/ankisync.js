"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnkiCollection = exports.getAnkiPath = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
/**
 * Most reliable way is to go to
 *
 * Tools >> Add-ons >> View Files
 */
function getAnkiPath(user) {
    const root = {
        win32: process.env.APPDATA,
        darwin: path_1.default.join(process.env.HOME, 'Library/Application Support')
    }[os_1.default.platform()] ||
        path_1.default.join(process.env.HOME, '.local/share');
    return path_1.default.join(root, 'Anki2', user);
}
exports.getAnkiPath = getAnkiPath;
/**
 * Get User's `collection.anki2`
 */
function getAnkiCollection(user) {
    return path_1.default.join(getAnkiPath(user), 'collection.anki2');
}
exports.getAnkiCollection = getAnkiCollection;
//# sourceMappingURL=dir.js.map