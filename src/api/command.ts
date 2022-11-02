import Bot from "./bot";
import { Message } from "discord.js";
import { EmbedBuilder } from "@discordjs/builders";

export enum CommandType {
  PARAMS,
  WIZARD,
  BOTH,
}

export interface CommandContext {
  bot: Bot;
  msg: Message;
  args: string[];
}

export interface CommandConfig {
  name: string;
  description: string;
  longDescription?: string;
  type?: CommandType;
  usage?: string[];
  tags?: string[];
  cooldown?: number;
  dmWorks?: boolean;
  userPermissions?: bigint;
  requiredRoles?: string[];
}

export default abstract class Command {
  public name: string;
  public description: string;
  public longDescription: string;
  public type: CommandType;
  public usage: string[];
  public tags: string[];
  public cooldown: number;
  public dmWorks: boolean;
  public userPermissions: bigint;
  public requiredRoles: string[] | undefined;

  protected constructor(config: CommandConfig) {
    this.name = config.name;
    this.description = config.description;
    this.longDescription = config.longDescription || config.description;
    this.type = config.type || CommandType.WIZARD;
    this.usage = config.usage || [];
    this.tags = config.tags || [];
    this.cooldown = config.cooldown || 0;
    this.dmWorks = config.dmWorks || false;
    this.userPermissions = config.userPermissions || BigInt(0);
    this.requiredRoles = config.requiredRoles;
  }

  public abstract exec(context: CommandContext): Promise<void>;

  public infoEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`Command ${this.name}`)
      .setDescription(`**${this.description}**`)
      .addFields([
        {
          name: "Usage",
          value:
            this.usage.length > 0
              ? this.usage.join(", ")
              : "No usage cases available",
          inline: true,
        },
        {
          name: "Tags",
          value: this.tags.length > 1 ? this.tags.join(", ") : "No tags",
          inline: true,
        },
        {
          name: "Works in DMs?",
          value: this.dmWorks ? "Yes" : "No",
          inline: true,
        },
        {
          name: "Cooldown",
          value: this.cooldown > 0 ? `${this.cooldown} seconds` : "None",
          inline: true,
        },
      ]);
  }

  public sendInvalidUsage(msg: Message, bot: Bot): void {
    bot.response.emit(
      msg.channel,
      this.getUsageText(bot.settings.prefix),
      "invalid"
    );
  }

  public getUsageText(prefix: string): string {
    return this.usage.length > 0
      ? "Usage\n" + this.usage.map((e) => `${prefix}${e}`).join("\n")
      : "No usage cases available.";
  }
}
