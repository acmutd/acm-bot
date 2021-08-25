"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const manager_1 = __importDefault(require("../../api/manager"));
const settings_1 = require("../../settings");
const fs = __importStar(require("fs"));
const shlex_1 = __importDefault(require("shlex"));
class CommandManager extends manager_1.default {
    constructor(bot, path) {
        super(bot);
        this.path = path;
        this.commands = new discord_js_1.Collection();
    }
    init() {
        fs.readdir(this.path, (err, files) => {
            this.bot.logger.info(`Found ${files.length} command(s)...`);
            files.forEach((file) => {
                const cmd = require(`${this.path.endsWith("/") ? this.path : this.path + "/"}${file}`);
                const command = new cmd.default();
                this.commands.set(command.name, command);
                this.bot.logger.info(`Loaded command '${command.name}'`);
            });
        });
    }
    cantInvoke(msg, command) {
        var _a, _b;
        const dm = msg.channel instanceof discord_js_1.DMChannel;
        if (dm && !command.dmWorks)
            return this.bot.response.build("DM functionality is not enabled for this command...", "invalid");
        if (command.userPermissions &&
            msg.member &&
            !msg.member.permissions.has(command.userPermissions))
            return this.bot.response.build("Invalid permission level...", "invalid");
        if (command.requiredRoles &&
            msg.member &&
            !((_a = msg.member) === null || _a === void 0 ? void 0 : _a.roles.cache.some((role) => command.requiredRoles.findIndex((rr) => rr == role.id) != -1))) {
            const role = (_b = msg.guild) === null || _b === void 0 ? void 0 : _b.roles.cache.get(command.requiredRoles[0]);
            return this.bot.response.build(`Missing role '${role === null || role === void 0 ? void 0 : role.toString()}'...`, "invalid");
        }
        if (this.bot.config.disabledCommands &&
            this.bot.config.disabledCommands.includes(command.name))
            return this.bot.response.build("Command disabled...", "invalid");
    }
    handle(msg) {
        if (msg.author.bot)
            return;
        if (!msg.content.startsWith(settings_1.settings.prefix))
            return;
        const command = msg.content.substring(settings_1.settings.prefix.length).split(" ")[0];
        const args = shlex_1.default
            .split(msg.content.slice(settings_1.settings.prefix.length).trim())
            .slice(1);
        const cmd = this.bot.managers.command.commands.get(command);
        if (!cmd)
            return this.bot.response.emit(msg.channel, `Invalid command...`, "invalid");
        if (this.bot.managers.indicator.hasUser("usingCommand", msg.author))
            return this.bot.response.emit(msg.channel, "You are already using a command. Please complete that action before beginning another...", "invalid");
        const response = this.cantInvoke(msg, cmd);
        if (response)
            return this.bot.response.emitBuild(msg.channel, response);
        this.bot.managers.indicator.addUser("usingCommand", msg.author);
        try {
            cmd.exec({ bot: this.bot, msg, args });
        }
        catch (e) {
            msg.reply("Command execution failed. Please contact a bot maintainer...");
            throw e;
        }
        finally {
            this.bot.managers.indicator.removeUser("usingCommand", msg.author);
        }
    }
}
exports.default = CommandManager;
