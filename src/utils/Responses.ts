import { MessageEmbed, TextChannel, DMChannel, ColorResolvable, NewsChannel } from "discord.js";

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
    },
};

export type ResponseType = 
    'error' 
    | 'invalid' 
    | 'warning' 
    | 'normal' 
    | 'success';

export type ResponseFormat = 'simple' | 'embed';
/**
 * ACMBot message response utility (raw, embed support) factory-style build function.
 */
export default class ResponseUtil {

    public format: ResponseFormat;

    constructor(format: ResponseFormat) {
        this.format = format;
    }

    private simple(msg: string, emoji: string) {
        return `${emoji} | ${msg}`;
    }
    private embed(msg: string, emojiSet: {simple: string, embed: string, color: ColorResolvable}) {
        return new MessageEmbed()
            .setDescription(`${emojiSet.embed} | **${msg}**`)
            .setColor(emojiSet.color);
    }

    build(message: string, type?: ResponseType, format?: ResponseFormat) : string | MessageEmbed {
        type = type || 'normal';
        format = format || this.format;

        let response: MessageEmbed | string = '';

        switch(type) {
            case 'error':
                response = format == 'simple' 
                    ? this.simple(message, emoji.error.simple) 
                    : this.embed(message, emoji.error);
                break;
            case 'invalid':
                response = format == 'simple' 
                    ? this.simple(message, emoji.invalid.simple) 
                    : this.embed(message, emoji.invalid);
                break;
            case 'warning':
                response = format == 'simple' 
                    ? this.simple(message, emoji.warning.simple) 
                    : this.embed(message, emoji.warning);
                break;
            case 'normal':
                response = format == 'simple' 
                    ? this.simple(message, emoji.normal.simple) 
                    : this.embed(message, emoji.normal);
                break;
            case 'success':
                response = format == 'simple' 
                    ? this.simple(message, emoji.success.simple) 
                    : this.embed(message, emoji.success);
                break;
        }
        return response;
    }
    
    emit(channel: TextChannel | DMChannel | NewsChannel, message: string, type?: ResponseType, format?: ResponseFormat) {
        const response = this.build(message, type, format);
        typeof response == 'string' 
            ? channel.send(response) 
            : channel.send({ embed: response })
    }

    emitBuild(channel: TextChannel | DMChannel | NewsChannel, response: string | MessageEmbed) {
        typeof response == 'string' 
        ? channel.send(response) 
        : channel.send({ embed: response })
    }
}