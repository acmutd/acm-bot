import { Collection, DMChannel, Message } from "discord.js";
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
    this.path = path.endsWith("/") ? path : path + "/";
    this.commands = new Collection();
  }

  /**
   * Dynamically load all commands from some path
   */
  public init(): void {
    fs.readdir(this.path, (err, files) => {
      files.forEach((file) => {
        // Skip non-js files, such as map files.
        if (!file.endsWith(".js")) return;

        // Load command
        const cmd = require(this.path + file);
        const command = new cmd.default();
        this.commands.set(command.name, command);

        this.bot.logger.info(`Loaded command '${command.name}'`);
      });
    });
  }

  /**
   * Determine if a user has permissions to use a command
   * @param msg Message object of command
   * @param command Command object
   * @returns Plaintext/embed error message, or void if everything is fine
   */
  public async cantInvoke(
    msg: Message,
    command: Command
  ): Promise<string | void> {
    // Filter on dmWorks
    const dm = msg.channel instanceof DMChannel;
    if (dm && !command.dmWorks) return "This command does not work in DMs.";

    // Filter on userPermissions
    if (
      command.userPermissions &&
      msg.member &&
      !msg.member.permissions.has(command.userPermissions)
    )
      return "Unauthorized permission level.";

    // Filter on requiredRoles (Check if user has any of them, >=1 is enough)
    if (
      command.requiredRoles &&
      msg.member &&
      !msg.member?.roles.cache.some(
        (role) => command.requiredRoles!.findIndex((rr) => rr == role.id) != -1
      )
    ) {
      const role = await msg.guild?.roles.fetch(command.requiredRoles[0]);
      return `Missing a role to perform this command, such as '${role?.toString()}'.`;
    }

    // Filter on command disabled
    if (
      this.bot.config.disabledCommands &&
      this.bot.config.disabledCommands.includes(command.name)
    )
      return "Command disabled.";
  }

  /**
   * Handle messages that might be commands
   * @param msg Message to handle
   */
  public async handle(msg: Message): Promise<void> {
    // Basic filtering
    if (msg.author.bot) return;
    if (!msg.content.startsWith(settings.prefix)) return;

    // Get first word after the prefix, i.e. potential command name
    const command = msg.content.substring(settings.prefix.length).split(" ")[0];

    // Check if command exists
    const cmd = this.commands.get(command);
    if (!cmd) return;

    // Check if we are already running a command from the user
    if (this.bot.managers.indicator.hasUser("usingCommand", msg.author))
      return this.bot.response.emit(
        msg.channel,
        "You are already using a command. Please complete that action before beginning another.",
        "invalid"
      );

    // Check if the user has permissions
    const permsError = await this.cantInvoke(msg, cmd);
    if (permsError)
      return this.bot.response.emit(msg.channel, permsError, "invalid");

    // Try parsing arguments, with quotes to support multi-word arguments
    let args: Array<string>;
    try {
      args = shlex
        .split(msg.content.slice(settings.prefix.length).trim())
        .slice(1);
    } catch (e) {
      return this.bot.response.emit(
        msg.channel,
        "Wasn't able to parse your command's arguments. " +
          "Quotes are used for multi-word arguments and MUST be matched.",
        "invalid"
      );
    }

    // Execute command
    try {
      this.bot.managers.indicator.addUser("usingCommand", msg.author);
      await cmd.exec({ bot: this.bot, msg, args });
    } catch (e) {
      await msg.reply(
        "Command execution failed. Please contact a bot maintainer."
      );
      console.error(e);
      // Don't throw and let the bot handle this as an unhandled rejection. Instead,
      // take initiative to handle it as an error so we can see the trace.
      await this.bot.managers.error.handleErr(e);
    } finally {
      this.bot.managers.indicator.removeUser("usingCommand", msg.author);
    }
  }
}
