"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ankiconnect = void 0;
const axios_1 = __importDefault(require("axios"));
exports.ankiconnect = {
    api: axios_1.default.create({
        baseURL: 'http://127.0.0.1:8765'
    }),
    async invoke(action, params = {}, version = 6) {
        const { data: { result, error } } = await this.api.post('/', { action, version, params });
        if (error) {
            throw new Error(error);
        }
        return result;
    }
};
//# sourceMappingURL=ankiconnect.js.map