import {
  ApplicationCommandPermissionData,
  CommandInteraction,
  Interaction,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import BaseInteraction, {
  InteractionConfig,
  InteractionContext,
} from "./interaction";
import Bot from "../bot";

export interface SlashCommandConfig extends InteractionConfig {
  description?: string;
  permissions?: ApplicationCommandPermissionData[];
}

export interface SlashCommandContext extends InteractionContext {
  interaction: CommandInteraction;
}

export default abstract class SlashCommand extends BaseInteraction {
  public readonly description: string | undefined;
  public readonly permissions: ApplicationCommandPermissionData[] | undefined;

  protected readonly slashCommand: SlashCommandBuilder =
    new SlashCommandBuilder();

  get slashCommandJson() {
    return this.slashCommand.toJSON();
  }

  protected constructor(config: SlashCommandConfig) {
    super(config);

    // Pull slash command configs
    if (config.description) this.description = config.description;
    if (config.permissions) {
      this.permissions = config.permissions;
    }

    // Build slash command json
    this.buildSlashCommand();
    this.buildSlashCommandFromConfig();
  }

  /**
   * Child-handled customizations to the slash command.
   * Do not worry about items in the config. These will be handled by the super class
   * @protected
   */
  protected abstract buildSlashCommand(): any;

  private buildSlashCommandFromConfig() {
    this.slashCommand.setName(this.name);
    if (this.description) this.slashCommand.setDescription(this.description);
    if (this.permissions) this.slashCommand.setDefaultPermission(false);
  }

  public abstract handleInteraction(context: SlashCommandContext): any;
}
