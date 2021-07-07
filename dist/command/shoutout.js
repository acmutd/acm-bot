"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = __importDefault(require("../api/command"));
const settings_1 = require("../settings");
const discord_js_1 = require("discord.js");
class ShoutoutCommand extends command_1.default {
    constructor() {
        super({
            name: 'shoutout',
            description: 'Give a shoutout to someone special...',
            usage: ['shoutout [list of mentions] [reason for shoutout]']
        });
    }
    exec({ msg, bot, args }) {
        var _a, _b, _c, _d, _e;
        if (!/^<@!?[\d]{17,18}>/.test(args[0]))
            return bot.response.emit(msg.channel, 'No user mentions...', 'invalid');
        const receivers = msg.mentions.members.array();
        let title = `📣 ${(_b = (_a = msg.member) === null || _a === void 0 ? void 0 : _a.nickname) !== null && _b !== void 0 ? _b : msg.author.username} gave a shoutout to `;
        const last = receivers.pop();
        if (receivers.length > 0)
            title += `${receivers.map((m) => { var _a; return (_a = m.nickname) !== null && _a !== void 0 ? _a : m.user.username; }).join(', ')}${receivers.length > 0 ? ', and ' : ''}${(_c = last === null || last === void 0 ? void 0 : last.nickname) !== null && _c !== void 0 ? _c : last === null || last === void 0 ? void 0 : last.user.username}`;
        else
            title += `${(_d = last === null || last === void 0 ? void 0 : last.nickname) !== null && _d !== void 0 ? _d : last === null || last === void 0 ? void 0 : last.user.username}`;
        const reg = /^.*?(<@!?[\d]{17,18}>|\s)+/;
        const text = msg.content.replace(reg, '');
        if (text.length < 1)
            return this.sendInvalidUsage(msg, bot);
        const embed = new discord_js_1.MessageEmbed({
            title, fields: [
                {
                    name: 'Given to:',
                    value: msg.content.match(reg)[0].replace(settings_1.settings.prefix + 'shoutout', '')
                },
                {
                    name: 'For:',
                    value: text
                }
            ],
            color: 'RANDOM'
        });
        const channel = (_e = msg.guild) === null || _e === void 0 ? void 0 : _e.channels.resolve(settings_1.settings.channels.shoutout);
        channel.send(embed);
        channel.send(msg.content.match(reg)[0].replace(settings_1.settings.prefix + 'shoutout', ''));
        return bot.response.emit(msg.channel, `Your shoutout has been sent to <#${channel}>!`);
    }
}
exports.default = ShoutoutCommand;
