import {
  ButtonInteraction,
  Collection,
  CommandInteraction,
  ContextMenuInteraction,
  GuildApplicationCommandPermissionData,
  Interaction,
} from "discord.js";
import Bot from "../../api/bot";
import Manager from "../../api/manager";
import BaseInteraction from "../../api/interaction/interaction";
import DynamicLoader from "../dynamicloader";
import { Routes } from "discord-api-types/v9";
import SlashCommand from "../../api/interaction/slashcommand";
import CustomButtonInteraction from "../../api/interaction/button";
import ContextMenuCommand from "../../api/interaction/contextmenucommand";
import { ApplicationCommandType } from "discord-api-types";

export default class InteractionManager extends Manager {
  // private readonly interactionPath = process.cwd() + "/dist/interaction/";
  private readonly slashCommandPath =
    process.cwd() + "/dist/interaction/command/";
  private readonly cmCommandPath =
    process.cwd() + "/dist/interaction/contextmenu/";
  private readonly buttonPath = process.cwd() + "/dist/interaction/button/";

  private slashCommands: Map<string, SlashCommand>;
  private cmCommands: Map<string, ContextMenuCommand>;
  private buttons: Map<string, CustomButtonInteraction>;

  constructor(bot: Bot) {
    super(bot);
  }

  /**
   * Dynamically load all interaction handlers and register slash commands
   */
  public init() {
    // this.loadInteractionHandlers();
    this.registerSlashAndContextMenuCommands();
    this.registerButtons();
  }

  /**
   * Handle messages that might be commands
   * @param interaction
   */
  public async handleInteraction(interaction: Interaction) {
    // Resolve the correct handler for this interaction
    let handler: BaseInteraction;
    if (interaction.isCommand()) {
      handler = this.slashCommands.get(interaction.commandName);
    } else if (interaction.isContextMenu()) {
      handler = this.cmCommands.get(interaction.commandName);
    } else if (interaction.isButton()) {
      handler = [...this.buttons.values()].find((x) =>
        x.matchCustomId(interaction.customId)
      );
    } else return;

    // Return if not found
    if (!handler) return;

    // Execute command
    try {
      await handler.handleInteraction({ bot: this.bot, interaction });
    } catch (e) {
      await interaction.reply(
        "Command execution failed. Please contact a bot maintainer..."
      );
      // Don't throw and let the bot handle this as an unhandled rejection. Instead,
      // take initiative to handle it as an error so we can see the trace.
      await this.bot.managers.error.handleErr(e);
    }
  }

  /**
   * Registers slash commands and context menu commands together. They must be done together,
   * because they need to be sent in the same API call or else the second will overwrite/delete
   * the first. Thx Discord :)
   * @private
   */
  private async registerSlashAndContextMenuCommands() {
    try {
      // Load commands dynamically
      this.slashCommands = new Map(
        DynamicLoader.loadClasses(this.slashCommandPath).map((sc) => [
          sc.name,
          sc,
        ])
      );
      this.cmCommands = new Map(
        DynamicLoader.loadClasses(this.cmCommandPath).map((sc) => [sc.name, sc])
      );

      for (const cmdName of this.slashCommands.keys()) {
        this.bot.logger.info(`Loaded slash command '${cmdName}'`);
      }
      for (const cmdName of this.cmCommands.keys()) {
        this.bot.logger.info(`Loaded context menu command '${cmdName}'`);
      }

      // Register commands
      const slashCommandJsons = Array.from(this.slashCommands.values()).map(
        (sc) => sc.slashCommandJson
      );
      const contextMenuCommandJsons = Array.from(this.cmCommands.values()).map(
        (cmc) => cmc.contextMenuCommandJson
      );

      await this.bot.restConnection.put(
        Routes.applicationGuildCommands(
          this.bot.user.id,
          this.bot.settings.guild
        ),
        { body: slashCommandJsons.concat(contextMenuCommandJsons) }
      );

      // Set permissions
      let fullPermissions: GuildApplicationCommandPermissionData[] = [];
      const guildCommandManager = await (
        await this.bot.guilds.fetch(this.bot.settings.guild)
      ).commands;

      const guildCommands = await guildCommandManager.fetch();
      guildCommands.forEach((cmd, snowflake) => {
        if (
          cmd.type == "CHAT_INPUT" &&
          this.slashCommands.has(cmd.name) &&
          this.slashCommands.get(cmd.name).permissions
        ) {
          fullPermissions.push({
            id: snowflake,
            permissions: this.slashCommands.get(cmd.name).permissions,
          });
        } else if (
          cmd.type == "MESSAGE" &&
          this.cmCommands.has(cmd.name) &&
          this.cmCommands.get(cmd.name).permissions
        ) {
          fullPermissions.push({
            id: snowflake,
            permissions: this.cmCommands.get(cmd.name).permissions,
          });
        }
      });

      // Bulk update all permissions
      await guildCommandManager.permissions.set({ fullPermissions });
    } catch (error) {
      await this.bot.managers.error.handleErr(error);
    }
  }

  private async registerButtons() {
    try {
      // Dynamically load source files
      this.buttons = new Map(
        DynamicLoader.loadClasses(this.buttonPath).map((sc) => [sc.name, sc])
      );

      for (const btn of this.buttons.keys()) {
        this.bot.logger.info(`Loaded button '${btn}'`);
      }
    } catch (error) {
      await this.bot.managers.error.handleErr(error);
    }
  }
}
