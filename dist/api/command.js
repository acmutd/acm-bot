"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandType = void 0;
const discord_js_1 = require("discord.js");
var CommandType;
(function (CommandType) {
    CommandType[CommandType["PARAMS"] = 0] = "PARAMS";
    CommandType[CommandType["WIZARD"] = 1] = "WIZARD";
    CommandType[CommandType["BOTH"] = 2] = "BOTH";
})(CommandType = exports.CommandType || (exports.CommandType = {}));
class Command {
    constructor(config) {
        this.name = config.name;
        this.description = config.description;
        this.longDescription = config.longDescription || config.description;
        this.type = config.type || CommandType.WIZARD;
        this.usage = config.usage || [];
        this.tags = config.tags || [];
        this.cooldown = config.cooldown || 0;
        this.dmWorks = config.dmWorks || false;
        this.userPermissions = config.userPermissions || 0;
        this.requiredRoles = config.requiredRoles;
    }
    infoEmbed() {
        const embed = new discord_js_1.MessageEmbed()
            .setTitle(`Command ${this.name}`)
            .setDescription(`**${this.description}**`)
            .addField("Usage", this.usage.length > 0
            ? this.usage.join(", ")
            : "No usage cases available", true)
            .addField("Tags", this.tags.length > 1 ? this.tags.join(", ") : "No tags", true)
            .addField("Works in DMs?", this.dmWorks ? "Yes" : "No", true)
            .addField("Cooldown", `${this.cooldown} seconds`, true);
        return embed;
    }
    sendInvalidUsage(msg, bot) {
        bot.response.emit(msg.channel, this.getUsageText(bot.settings.prefix), "invalid");
    }
    getUsageText(prefix) {
        return this.usage.length > 0
            ? "Usage\n" + this.usage.map((e) => `${prefix}${e}`).join("\n")
            : "No usage cases available.";
    }
}
exports.default = Command;
