"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnkiCollection = exports.getAnkiPath = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
/**
 * Most reliable way is to go to
 *
 * Tools >> Add-ons >> View Files
 */
function getAnkiPath(user) {
    const root = () => {
        switch (os_1.default.platform()) {
            case 'linux':
                if (fs_1.default.readFileSync('/proc/version', 'utf8').includes('microsoft')) {
                    return path_1.default.join('/mnt', child_process_1.spawnSync('cmd.exe', ['/c', 'echo', '%APPDATA%'])
                        .stdout.toString()
                        .trim()
                        .replace(/^(\S+):/, (_, p) => p.toLocaleLowerCase())
                        .replace(/\\/g, '/'));
                }
                break;
            case 'win32':
                return process.env.APPDATA;
            case 'darwin':
                return path_1.default.join(process.env.HOME, 'Library/Application Support');
        }
        return path_1.default.join(process.env.HOME, '.local/share');
    };
    return path_1.default.join(root(), 'Anki2', user);
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