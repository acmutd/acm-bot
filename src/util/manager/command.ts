import { Collection, Message, DMChannel, MessageEmbed } from "discord.js";
import Command from "../../api/command";
import Bot from "../../api/bot";
import Manager from "../../api/manager";
import { settings } from "../../settings";
import * as fs from "fs";
import shlex from "shlex";

export default class CommandManager extends Manager {
  public path: string;
  public commands: Collection<string, Command>;

  constructor(bot: Bot, path: string) {
    super(bot);
    this.path = path;
    this.commands = new Collection();
  }
  public init(): void {
    fs.readdir(this.path, (err, files) => {
      this.bot.logger.info(`Found ${files.length} command(s)...`);
      files.forEach((file) => {
        const cmd = require(`${
          this.path.endsWith("/") ? this.path : this.path + "/"
        }${file}`);
        const command = new cmd.default();
        this.commands.set(command.name, command);
        this.bot.logger.info(`Loaded command '${command.name}'`);
      });
    });
  }
  public cantInvoke(
    msg: Message,
    command: Command
  ): string | MessageEmbed | void {
    const dm = msg.channel instanceof DMChannel;
    if (dm && !command.dmWorks)
      return this.bot.response.build(
        "DM functionality is not enabled for this command...",
        "invalid"
      );
    if (
      command.userPermissions &&
      msg.member &&
      !msg.member.permissions.has(command.userPermissions)
    )
      return this.bot.response.build("Invalid permission level...", "invalid");
    if (
      command.requiredRoles &&
      msg.member &&
      !msg.member?.roles.cache.some(
        (role) => command.requiredRoles!.findIndex((rr) => rr == role.id) != -1
      )
    ) {
      const role = msg.guild?.roles.cache.get(command.requiredRoles[0]);
      return this.bot.response.build(
        `Missing role '${role?.toString()}'...`,
        "invalid"
      );
    }
    if (
      this.bot.config.disabledCommands &&
      this.bot.config.disabledCommands.includes(command.name)
    )
      return this.bot.response.build("Command disabled...", "invalid");
  }
  public handle(msg: Message): void {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(settings.prefix)) return;
    const command = msg.content.substring(settings.prefix.length).split(" ")[0];
    const args = shlex
      .split(msg.content.slice(settings.prefix.length).trim())
      .slice(1);

    const cmd = this.bot.managers.command.commands.get(command) as Command;
    if (!cmd)
      return this.bot.response.emit(
        msg.channel,
        `Invalid command...`,
        "invalid"
      );
    if (this.bot.managers.indicator.hasUser("usingCommand", msg.author))
      return this.bot.response.emit(
        msg.channel,
        "You are already using a command. Please complete that action before beginning another...",
        "invalid"
      );

    const response = this.cantInvoke(msg, cmd);
    if (response) return this.bot.response.emitBuild(msg.channel, response);
    this.bot.managers.indicator.addUser("usingCommand", msg.author);
    try {
      cmd.exec({ bot: this.bot, msg, args });
    } catch (e) {
      msg.reply("Command execution failed. Please contact a bot maintainer...");
      throw e;
    } finally {
      this.bot.managers.indicator.removeUser("usingCommand", msg.author);
    }
  }
}
