import {
  ButtonInteraction,
  Collection,
  CommandInteraction,
  ContextMenuInteraction,
  GuildApplicationCommandPermissionData,
  Interaction,
  Permissions,
} from "discord.js";
import path from "path";
import Bot from "../../api/bot";
import Manager from "../../api/manager";
import BaseInteraction from "../../api/interaction/interaction";
import DynamicLoader from "../dynamicloader";
import {
  ApplicationCommandPermissionType,
  Routes,
} from "discord-api-types/v10";
import SlashCommand from "../../api/interaction/slashcommand";
import CustomButtonInteraction from "../../api/interaction/button";
import ContextMenuCommand from "../../api/interaction/contextmenucommand";

export default class InteractionManager extends Manager {
  // private readonly interactionPath = process.cwd() + "/dist/interaction/";
  private slashCommandPath: string;
  private cmCommandPath: string;
  private buttonPath: string;

  private slashCommands: Map<string, SlashCommand> = new Map();
  private cmCommands: Map<string, ContextMenuCommand> = new Map();
  private buttons: Map<string, CustomButtonInteraction> = new Map();

  constructor(
    bot: Bot,
    slashCommandPath: string,
    cmCommandPath: string,
    buttonPath: string
  ) {
    super(bot);
    this.slashCommandPath = slashCommandPath;
    this.cmCommandPath = cmCommandPath;
    this.buttonPath = buttonPath;
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
      handler = this.slashCommands.get(
        interaction.commandName
      ) as BaseInteraction;
    } else if (interaction.isContextMenu()) {
      handler = this.cmCommands.get(interaction.commandName) as BaseInteraction;
    } else if (interaction.isButton()) {
      handler = [...this.buttons.values()].find((x) =>
        x.matchCustomId(interaction.customId)
      ) as BaseInteraction;
    } else return;

    // Return if not found
    if (!handler) return;

    // Execute command
    try {
      await handler.handleInteraction({ bot: this.bot, interaction });
    } catch (e: any) {
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
      // Load slash commands
      const slashCommands = await DynamicLoader.loadClasses(
        this.slashCommandPath
      );

      this.slashCommands = new Map(slashCommands.map((sc) => [sc.name, sc]));

      const cm = (await DynamicLoader.loadClasses(
        this.cmCommandPath
      )) as ContextMenuCommand[];
      // Load context menu commands
      this.cmCommands = new Map<string, ContextMenuCommand>(
        cm.map((c) => [c.name, c])
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
          this.bot.user!.id,
          this.bot.settings.guild
        ),
        { body: [...slashCommandJsons, ...contextMenuCommandJsons] }
      );

      // Bulk update all permissions
    } catch (error: any) {
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
    } catch (error: any) {
      await this.bot.managers.error.handleErr(error);
    }
  }
}
