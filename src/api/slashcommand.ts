import { ApplicationCommandPermissionData } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export interface SlashCommandConfig {
  name: string;
  description?: string;
  permissions?: ApplicationCommandPermissionData[];
}

export default abstract class SlashCommand {
  public name: string;
  public description: string | undefined;
  public readonly permissions: ApplicationCommandPermissionData[] | undefined;

  protected readonly slashCommand: SlashCommandBuilder;

  protected constructor(config: SlashCommandConfig) {
    this.name = config.name;
    this.slashCommand = new SlashCommandBuilder();

    if (config.description) this.description = config.description;

    if (config.permissions) {
      this.permissions = config.permissions;
    }
  }

  public getSlashCommandJSON() {
    // Ensure the name, description, etc has been set.
    this.slashCommand.setName(this.name);

    if (this.description) this.slashCommand.setDescription(this.description);

    if (this.permissions) this.slashCommand.setDefaultPermission(false);

    try {
      this.slashCommand.toJSON();
    } catch (error) {
      console.log(error);
    }

    return this.slashCommand.toJSON();
  }
}
