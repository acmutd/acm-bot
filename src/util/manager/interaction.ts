import {
  Collection,
  CommandInteraction,
  GuildApplicationCommandPermissionData,
  Interaction,
} from "discord.js";
import Bot from "../../api/bot";
import Manager from "../../api/manager";
import BaseInteraction from "../../api/interaction";
import DynamicLoader from "../dynamicloader";
import { Routes } from "discord-api-types/v9";
import SlashCommand from "../../api/slashcommand";

export default class InteractionManager extends Manager {
  // private readonly interactionPath = process.cwd() + "/dist/interaction/";
  private readonly slashCommandPath = process.cwd() + "/dist/slashcommand/";

  private slashCommands: Map<string, SlashCommand>;

  private interactions: Map<string, BaseInteraction>;

  constructor(bot: Bot) {
    super(bot);
    this.interactions = new Collection();
  }

  /**
   * Dynamically load all interaction handlers and register slash commands
   */
  public init() {
    // this.loadInteractionHandlers();
    this.registerSlashCommands();
  }

  /**
   * Handle messages that might be commands
   * @param interaction
   */
  public async handleInteraction(interaction: Interaction) {
    if (interaction.isCommand())
      await this.handleCommandInteraction(interaction);
  }

  private async handleCommandInteraction(interaction: CommandInteraction) {
    // Check if interaction handler exists
    const handler = this.slashCommands.get(interaction.commandName);
    if (!handler) return;

    // Execute command
    try {
      await handler.handleInteraction({ bot: this.bot, interaction });
    } catch (e) {
      await interaction.reply(
        "Command execution failed. Please contact a bot maintainer..."
      );
      console.error(e);
      // Don't throw and let the bot handle this as an unhandled rejection. Instead,
      // take initiative to handle it as an error so we can see the trace.
      await this.bot.managers.error.handleErr(e);
    }
  }

  // private loadInteractionHandlers() {
  //   DynamicLoader.loadClasses(this.interactionPath).forEach((interaction) => {
  //     this.interactions.set(interaction.name, interaction);
  //     this.bot.logger.info(`Loaded interaction '${interaction.name}'`);
  //   });
  // }

  private async registerSlashCommands() {
    try {
      // Load slash commands dynamically
      this.slashCommands = new Map(
        DynamicLoader.loadClasses(this.slashCommandPath).map((sc) => [
          sc.name,
          sc,
        ])
      );

      for (const cmdName of this.slashCommands.keys()) {
        this.bot.logger.info(`Loaded slash command '${cmdName}'`);
      }

      // Register commands
      const commands = Array.from(this.slashCommands.values()).map(
        (sc) => sc.slashCommandJson
      );
      await this.bot.restConnection.put(
        Routes.applicationGuildCommands(
          this.bot.user.id,
          this.bot.settings.guild
        ),
        { body: commands }
      );

      // Set permissions
      let fullPermissions: GuildApplicationCommandPermissionData[] = [];
      const guildCommandManager = await (
        await this.bot.guilds.fetch(this.bot.settings.guild)
      ).commands;

      const guildCommands = await guildCommandManager.fetch();
      guildCommands.forEach((cmd, snowflake) => {
        if (
          this.slashCommands.has(cmd.name) &&
          this.slashCommands.get(cmd.name).permissions
        ) {
          fullPermissions.push({
            id: snowflake,
            permissions: this.slashCommands.get(cmd.name).permissions,
          });
        }
      });

      // Bulk update all permissions
      await guildCommandManager.permissions.set({ fullPermissions });
    } catch (error) {
      await this.bot.managers.error.handleErr(error);
    }
  }
}
