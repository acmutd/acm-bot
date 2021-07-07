"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = __importDefault(require("../api/command"));
class PingCommand extends command_1.default {
    constructor() {
        super({
            name: 'ping',
            description: 'Fetch the bot\'s response time...'
        });
    }
    exec({ msg, bot, args }) {
        const startTime = new Date().getTime();
        msg.channel.send('Ping: This message should be deleted...').then((m) => m.delete());
        bot.response.emit(msg.channel, `:ping_pong: | ${(new Date().getTime() - startTime) / 1000}s response time...`, 'success');
    }
}
exports.default = PingCommand;
