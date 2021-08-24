"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("../../api/manager"));
class ResolveManager extends manager_1.default {
    constructor(bot) {
        super(bot);
    }
    init() { }
    resolveGuildMember(toResolve, guild, strategies = new Set(), lenient = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let member;
            if (!member &&
                (strategies.size === 0 || strategies.has("id")) &&
                /^[\d]{17,18}$/.test(toResolve))
                member = guild === null || guild === void 0 ? void 0 : guild.members.cache.find((gm) => gm.user.id === toResolve);
            if (!member &&
                (strategies.size === 0 || strategies.has("mention")) &&
                /^<@!?[\d]{17,18}>$/.test(toResolve))
                member = guild === null || guild === void 0 ? void 0 : guild.members.cache.find((gm) => gm.user.id === toResolve.slice(3, -1));
            if (!member &&
                (strategies.size === 0 || strategies.has("tag")) &&
                /#\d{4}$/.test(toResolve))
                member = guild === null || guild === void 0 ? void 0 : guild.members.cache.find((gm) => gm.user.tag === toResolve);
            if (!member && (strategies.size === 0 || strategies.has("username")))
                member = guild === null || guild === void 0 ? void 0 : guild.members.cache.find((gm) => gm.user.username === toResolve);
            if (!member && (strategies.size === 0 || strategies.has("nickname")))
                member = guild === null || guild === void 0 ? void 0 : guild.members.cache.find((gm) => gm.nickname === toResolve);
            if (lenient) {
                toResolve = this.makeLenient(toResolve);
                if (!member &&
                    (strategies.size === 0 || strategies.has("tag")) &&
                    /#\d{4}$/.test(toResolve))
                    member = guild === null || guild === void 0 ? void 0 : guild.members.cache.find((gm) => this.makeLenient(gm.user.tag) === toResolve);
                if (!member && (strategies.size === 0 || strategies.has("username")))
                    member = guild === null || guild === void 0 ? void 0 : guild.members.cache.find((gm) => this.makeLenient(gm.user.username) === toResolve);
                if (!member && (strategies.size === 0 || strategies.has("nickname")))
                    member = guild === null || guild === void 0 ? void 0 : guild.members.cache.find((gm) => this.makeLenient(gm.nickname ? gm.nickname : "") === toResolve);
            }
            return member;
        });
    }
    makeLenient(str) {
        return str.replace(" ", "").toLowerCase();
    }
}
exports.default = ResolveManager;
