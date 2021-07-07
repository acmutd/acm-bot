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
const command_1 = __importDefault(require("../api/command"));
class VCSnapshot extends command_1.default {
    constructor() {
        super({
            name: 'vcsnapshot',
            description: 'Take a snapshot of all users in your current voice channel...',
            longDescription: 'Take a snapshot of all users in your current voice channel. You can also pass in a voice channel ID to take a snapshot of it without having to join...',
            usage: [
                'vcsnapshot',
                'vcsnapshot [channel-id]'
            ],
            dmWorks: false
        });
    }
    exec({ msg, bot, args }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let voiceChannel;
            let attendees = [];
            if (args.length > 0) {
                const chan = /^\d{17,19}$/.test(args[0]) ? yield bot.channels.fetch(args[0]) : undefined;
                if (!chan || chan.type !== 'voice')
                    return bot.response.emit(msg.channel, `Could not resolve the given ID into a valid voice channel...`, 'invalid');
                voiceChannel = chan;
            }
            else {
                voiceChannel = (_a = msg.member) === null || _a === void 0 ? void 0 : _a.voice.channel;
                if (!voiceChannel)
                    return bot.response.emit(msg.channel, `Please join a voice channel...`, 'invalid');
            }
            for (const [, member] of voiceChannel.members) {
                if (member.user.bot)
                    continue;
                attendees.push(`<@${member.id}>`);
            }
            msg.channel.send(`**VC Snapshot for \`${voiceChannel.name}\` requested by ${msg.author}**\n` +
                `Members (${attendees.length}): ${attendees.join(" ")}\n` +
                `Copyable: \` ${attendees.join("` `")}\``, { allowedMentions: { users: [] } }).catch(() => msg.channel.send(`**VC Snapshot request failed for ${msg.author}**`, { allowedMentions: { users: [] } }));
        });
    }
}
exports.default = VCSnapshot;
