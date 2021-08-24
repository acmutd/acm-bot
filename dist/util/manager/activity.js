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
const settings_1 = require("../../settings");
class ActivityManager extends manager_1.default {
    constructor(bot) {
        super(bot);
        this.enabled = false;
        this.activityLog = new Map();
        this.voiceLog = new Map();
    }
    init() { }
    handleVoiceStateUpdate(oldMember, newMember) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const oldVC = oldMember.channel;
            const newVC = newMember.channel;
            if (oldVC) {
                const data = {
                    userID: oldMember.id,
                    time: Date.now(),
                    joined: false,
                };
                (_a = this.voiceLog.get(oldVC.id)) === null || _a === void 0 ? void 0 : _a.push(data);
            }
            if (newVC) {
                const data = {
                    userID: newMember.id,
                    time: Date.now(),
                    joined: true,
                };
                (_b = this.voiceLog.get(newVC.id)) === null || _b === void 0 ? void 0 : _b.push(data);
            }
        });
    }
    startVoiceEvent(vc) {
        if (this.voiceLog.has(vc.id))
            return false;
        const data = new Array();
        const now = Date.now();
        for (const id of vc.members.keys()) {
            data.push({
                userID: id,
                time: now,
                joined: true,
            });
        }
        this.voiceLog.set(vc.id, data);
        return true;
    }
    stopVoiceEvent(vc) {
        if (!this.voiceLog.has(vc.id))
            return undefined;
        const stats = this.voiceEventStats(vc);
        this.voiceLog.delete(vc.id);
        return stats;
    }
    voiceEventStats(vc) {
        if (!this.voiceLog.has(vc.id))
            return undefined;
        const data = [...this.voiceLog.get(vc.id)];
        const now = Date.now();
        for (const id of vc.members.keys()) {
            data.push({
                userID: id,
                time: now,
                joined: false,
            });
        }
        const stats = new Map();
        const joinTime = new Map();
        for (const dat of data) {
            const id = dat.userID;
            const time = dat.time;
            if (joinTime.has(id)) {
                if (!stats.has(id))
                    stats.set(id, 0);
                stats.set(id, stats.get(id) + (time - joinTime.get(id)));
                joinTime.delete(id);
                continue;
            }
            else {
                joinTime.set(id, time);
            }
        }
        return stats;
    }
    handleMessage(msg) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const cooldown = 10 * 60;
            let indicators = this.bot.managers.indicator;
            if (msg.author.bot)
                return;
            if (msg.content.startsWith(settings_1.settings.prefix))
                return;
            if (((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id) !== settings_1.settings.guild)
                return;
            if (!this.enabled)
                return;
            if ((indicators.hasKey("textActivity", msg.author.id) &&
                msg.createdTimestamp >
                    indicators.getValue("textActivity", msg.author.id) +
                        cooldown * 1000) ||
                !indicators.hasKey("textActivity", msg.author.id)) {
                indicators.setKeyValue("textActivity", msg.author.id, msg.createdTimestamp);
                let { success, failure } = yield this.bot.managers.points.awardPoints(1, "Discord", new Set([msg.author.id]));
                if (success.length === 0) {
                }
                else {
                    console.log(`${new Date().toLocaleTimeString()}: ${msg.author.tag} was awarded 1pt for activity (${msg.createdTimestamp})`);
                }
            }
        });
    }
    enableTracking() {
        this.enabled = true;
    }
    disableTracking() {
        this.enabled = false;
    }
}
exports.default = ActivityManager;
