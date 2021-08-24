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
const discord_js_1 = require("discord.js");
const command_1 = __importDefault(require("../api/command"));
const settings_1 = require("../settings");
class VCEventCommand extends command_1.default {
    constructor() {
        super({
            name: "vcevent",
            description: "Records user statistics for your current voice channel...",
            usage: [
                "vcevent <start|stop|stats|list>",
                "vcevent <start|stop|stats> [channel-id]",
            ],
            dmWorks: false,
            requiredRoles: [settings_1.settings.roles.staff, settings_1.settings.points.staffRole],
        });
    }
    exec({ msg, bot, args }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let vc;
            let attendees = [];
            if (args.length < 1)
                return this.sendInvalidUsage(msg, bot);
            const action = args[0];
            if (args.length > 1) {
                const chan = /^\d{17,19}$/.test(args[1])
                    ? yield bot.channels.fetch(args[1])
                    : undefined;
                if (!chan || chan.type !== "voice")
                    return bot.response.emit(msg.channel, "Could not resolve that ID into a voice channel...", "invalid");
                vc = chan;
            }
            else {
                vc = (_a = msg.member) === null || _a === void 0 ? void 0 : _a.voice.channel;
                if (!vc && action !== "list")
                    return bot.response.emit(msg.channel, "Please join a voice channel...");
            }
            let data;
            switch (action) {
                case "start":
                case "begin":
                    if (bot.managers.activity.startVoiceEvent(vc))
                        return bot.response.emit(msg.channel, `VC Event started for ${vc}...`, "success");
                    else
                        return bot.response.emit(msg.channel, `VC Event already running ${vc}...`, "error");
                case "stop":
                case "end":
                    data = bot.managers.activity.stopVoiceEvent(vc);
                    if (!data)
                        return bot.response.emit(msg.channel, `No running VC Event in ${vc}...`, "error");
                    this.printStats(msg.channel, vc, data);
                    break;
                case "stats":
                    data = bot.managers.activity.voiceEventStats(vc);
                    if (!data)
                        return bot.response.emit(msg.channel, `No running VC Event in ${vc}...`, "error");
                    this.printStats(msg.channel, vc, data);
                    break;
                case "list":
                    const channels = Array.from(bot.managers.activity.voiceLog.keys()).map((id) => `<#${id}>`);
                    yield msg.channel.send(new discord_js_1.MessageEmbed({
                        title: "Current VC Events",
                        description: channels.length > 0 ? channels.join("\n") : "none",
                    }));
                    break;
                default:
                    return this.sendInvalidUsage(msg, bot);
            }
        });
    }
    printStats(channel, voiceChannel, stats) {
        return __awaiter(this, void 0, void 0, function* () {
            let sorted = Array.from(stats.keys()).sort((a, b) => stats.get(b) - stats.get(a));
            let descriptionArr = [];
            sorted.forEach((userID, i) => {
                const time = Math.round(stats.get(userID) / 60000);
                descriptionArr.push(`\`${i + 1}\`. <@${userID}>: ${time} minute${time === 1 ? "" : "s"}`);
            });
            yield channel.send(new discord_js_1.MessageEmbed({
                title: `Time spent in ${voiceChannel}...`,
                description: descriptionArr.join("\n"),
            }));
        });
    }
}
exports.default = VCEventCommand;
