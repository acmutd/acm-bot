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
const settings_1 = require("../../settings");
const manager_1 = __importDefault(require("../../api/manager"));
class CircleManager extends manager_1.default {
    constructor(bot) {
        super(bot);
        this.circleChannelId = this.bot.settings.channels.circles;
    }
    init() { }
    repost() {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = this.bot.channels.resolve(this.circleChannelId);
            const c = channel;
            yield c.bulkDelete(50);
            c.send("https://cdn.discordapp.com/attachments/537776612238950410/826695146250567681/circles.png");
            c.send(`> :yellow_circle: Circles are interest groups made by the community!\n` +
                `> :door: Join one by reacting to the emoji attached to each.\n` +
                `> :crown: You can apply to make your own Circle by filling out this application: <https://apply.acmutd.co/circles>\n`);
            const circles = this.bot.managers.database.cache.circles.array();
            for (const circle of circles) {
                const owner = yield c.guild.members.fetch(circle.owner).catch();
                const count = yield this.findMemberCount(circle._id);
                const role = yield c.guild.roles.fetch(circle._id);
                const encodedData = {
                    name: circle.name,
                    circle: circle._id,
                    reactions: {},
                    channel: circle.channel,
                };
                encodedData.reactions[`${circle.emoji}`] = circle._id;
                const embed = new discord_js_1.MessageEmbed({
                    title: `${circle.emoji} ${circle.name} ${circle.emoji}`,
                    description: `${encode(encodedData)}${circle.description}`,
                    color: role === null || role === void 0 ? void 0 : role.color,
                    thumbnail: {
                        url: circle.imageUrl,
                        height: 90,
                        width: 90,
                    },
                    fields: [
                        { name: "**Role**", value: `<@&${circle._id}>`, inline: true },
                        { name: "**Members**", value: `${count !== null && count !== void 0 ? count : "N/A"}`, inline: true },
                    ],
                    footer: {
                        text: `⏰ Created on ${circle.createdOn.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}${owner ? `﹒👑 Owner: ${owner.displayName}` : ""}`,
                    },
                });
                const msg = yield c.send(embed);
                msg.react(`${circle.emoji}`);
            }
        });
    }
    update(channel, circleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgs = yield channel.messages.fetch({ limit: 50 });
            let message;
            for (const m of msgs.array()) {
                if (m.embeds.length === 0)
                    return;
                if (!m.embeds[0].description)
                    return;
                const obj = decode(m.embeds[0].description);
                if (!obj || !obj.circle)
                    return;
                if (obj.circle === circleId) {
                    message = m;
                    break;
                }
            }
            if (!message)
                return;
            const memberField = message.embeds[0].fields.find((f) => f.name === "**Members**");
            if (!memberField)
                return;
            const count = yield this.findMemberCount(circleId);
            const embed = new discord_js_1.MessageEmbed({
                title: message.embeds[0].title || "",
                description: message.embeds[0].description || "",
                color: message.embeds[0].color || "",
                footer: message.embeds[0].footer || {},
                thumbnail: message.embeds[0].thumbnail || {},
                fields: [
                    { name: "**Role**", value: `<@&${circleId}>`, inline: true },
                    { name: "**Members**", value: `${count !== null && count !== void 0 ? count : "N/A"}`, inline: true },
                ],
            });
            message.edit(embed);
        });
    }
    findMemberCount(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const guild = yield this.bot.guilds.fetch(settings_1.settings.guild);
            return guild.members.cache.filter((m) => !!m.roles.cache.find((r) => r.id === id)).size;
        });
    }
    handleReactionAdd(reaction, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (reaction.partial)
                yield reaction.fetch();
            yield reaction.users.fetch();
            if (user.bot)
                return;
            if (reaction.message.embeds.length === 0)
                return;
            if (!reaction.message.embeds[0].description)
                return;
            const obj = decode(reaction.message.embeds[0].description);
            if (!obj || obj.reactions)
                return;
            let reactionRes;
            Object.keys(obj.reactions).forEach((n) => {
                if (reaction.emoji.name.includes(n))
                    reactionRes = obj.reactions[n];
            });
            if (!reactionRes)
                return;
            reaction.users.remove(user.id);
            const guild = yield this.bot.guilds.fetch(settings_1.settings.guild);
            const member = guild.members.resolve(user.id);
            if (!member)
                return;
            if (!member.roles.cache.has(reactionRes)) {
                yield member.roles.add(reactionRes);
                const chan = guild.channels.cache.get(obj.channel);
                chan.send(`${member}, welcome to ${obj.name}!`);
            }
            else {
                yield member.roles.remove(reactionRes);
            }
            this.update(reaction.message.channel, reactionRes);
        });
    }
}
exports.default = CircleManager;
function encode(obj) {
    return `[\u200B](http://fake.fake?data=${encodeURIComponent(JSON.stringify(obj))})`;
}
function decode(description) {
    if (!description)
        return;
    const re = /\[\u200B\]\(http:\/\/fake\.fake\?data=(.*?)\)/;
    const matches = description.match(re);
    if (!matches || matches.length < 2)
        return;
    return JSON.parse(decodeURIComponent(description.match(re)[1]));
}
