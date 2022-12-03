import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import BaseInteraction, {
  InteractionConfig,
  InteractionContext,
} from "./interaction";

export interface SlashCommandConfig extends InteractionConfig {
  description?: string;
  permissions?: string | number | bigint;
}

export interface SlashCommandContext extends InteractionContext {
  interaction: ChatInputCommandInteraction;
}

export default abstract class SlashCommand extends BaseInteraction {
  public readonly description: string | undefined;
  public readonly permissions: string | number | bigint | undefined;

  protected readonly slashCommand: SlashCommandBuilder =
    new SlashCommandBuilder();

  get slashCommandJson() {
    return this.slashCommand.toJSON();
  }

  protected constructor(config: SlashCommandConfig) {
    super(config);

    // Pull slash command configs
    if (config.description) this.description = config.description;
    if (config.permissions !== undefined) {
      this.permissions = config.permissions;
    }

    // Build slash command json
    this.buildSlashCommandFromConfig();
  }

  private buildSlashCommandFromConfig() {
    this.slashCommand.setName(this.name);
    if (this.description) this.slashCommand.setDescription(this.description);
    if (this.permissions !== undefined)
      this.slashCommand.setDefaultMemberPermissions(this.permissions);
  }

  public abstract handleInteraction(context: SlashCommandContext): any;
}
