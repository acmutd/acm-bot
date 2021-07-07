"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const emoji = {
    error: {
        simple: '❌',
        embed: ':x:',
        color: 'DARK_RED'
    },
    invalid: {
        simple: '🚫',
        embed: '🚫',
        color: 'RED'
    },
    warning: {
        simple: '⚠️',
        embed: '⚠️',
        color: 'YELLOW'
    },
    normal: {
        simple: '',
        embed: '',
        color: 'DARKER_GREY'
    },
    success: {
        simple: '✅',
        embed: '✅',
        color: 'GREEN'
    }
};
class ResponseUtil {
    constructor(format) {
        this.format = format;
    }
    simple(msg, emoji) {
        return `${emoji} | ${msg}`;
    }
    embed(msg, emojiSet) {
        return new discord_js_1.MessageEmbed().setDescription(`${emojiSet.embed} | **${msg}**`).setColor(emojiSet.color);
    }
    build(message, type, format) {
        type = type || 'normal';
        format = format || this.format;
        let response = '';
        let em;
        switch (type) {
            case 'error':
                em = emoji.error;
                break;
            case 'invalid':
                em = emoji.invalid;
                break;
            case 'warning':
                em = emoji.warning;
                break;
            case 'normal':
                em = emoji.normal;
                break;
            case 'success':
                em = emoji.success;
                break;
            default:
                return '';
        }
        return format == 'simple' ? this.simple(message, em.simple) : this.embed(message, em);
    }
    emit(channel, message, type, format) {
        const response = this.build(message, type, format);
        typeof response == 'string' ? channel.send(response) : channel.send({ embed: response });
    }
    emitBuild(channel, response) {
        typeof response == 'string' ? channel.send(response) : channel.send({ embed: response });
    }
}
exports.default = ResponseUtil;
