import { ApplicationCommandPermissionData, Interaction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import BaseInteraction, { InteractionConfig } from "./interaction";

export interface SlashCommandConfig extends InteractionConfig {
  description?: string;
  permissions?: ApplicationCommandPermissionData[];
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
  }

  /**
   * Configure all parts of this.slashCommand.
   * The super function handles setting name, description, and defaultPermission values.
   * @protected
   */
  protected buildSlashCommand() {
    this.slashCommand.setName(this.name);
    if (this.description) this.slashCommand.setDescription(this.description);
    if (this.permissions) this.slashCommand.setDefaultPermission(false);
  }
}
