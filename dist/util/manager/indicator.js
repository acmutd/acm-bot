"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const manager_1 = __importDefault(require("../../api/manager"));
class IndicatorManager extends manager_1.default {
    constructor(bot) {
        super(bot);
        this.indicators = new discord_js_1.Collection();
        this.indicatorCache = new discord_js_1.Collection();
    }
    init() { }
    hasUser(indicator, user) {
        return (this.indicators.has(indicator) &&
            this.indicators.get(indicator).includes(user.id));
    }
    addUser(indicator, user) {
        if (!this.indicators.has(indicator))
            this.indicators.set(indicator, []);
        this.indicators.get(indicator).push(user.id);
    }
    removeUser(indicator, user) {
        if (!this.indicators.has(indicator))
            return;
        this.indicators.set(indicator, this.indicators.get(indicator).filter((id) => id != user.id));
    }
    getCache(indicator) {
        if (!this.indicatorCache.has(indicator))
            return;
        return this.indicatorCache.get(indicator);
    }
    hasKey(indicator, key) {
        return (this.indicatorCache.has(indicator) &&
            this.indicatorCache.get(indicator).has(key));
    }
    getValue(indicator, key) {
        if (!this.indicatorCache.has(indicator))
            return;
        return this.indicatorCache.get(indicator).get(key);
    }
    setKeyValue(indicator, key, value) {
        if (!this.indicatorCache.has(indicator))
            this.indicatorCache.set(indicator, new discord_js_1.Collection());
        this.indicatorCache.get(indicator).set(key, value);
    }
    removeKey(indicator, key) {
        if (!this.indicatorCache.has(indicator))
            return;
        this.indicatorCache.get(indicator).delete(key);
    }
}
exports.default = IndicatorManager;
