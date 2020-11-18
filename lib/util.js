"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAsync = void 0;
async function mapAsync(arr, cb) {
    return Promise.all(arr.map(async (el, i, a0) => {
        return await cb(el, i, a0);
    }));
}
exports.mapAsync = mapAsync;
//# sourceMappingURL=util.js.map