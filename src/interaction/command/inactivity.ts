import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { GuildMember, MessageEmbed, TextChannel } from "discord.js";
import { settings } from "../../settings";
import { APIEmbedField } from "discord-api-types";

export default class InactivityCommand extends SlashCommand {
  public constructor() {
    super({
      name: "inactivity",
      description: "Generate inactivity report for a circle",
    });
    this.slashCommand.addStringOption((option) =>
      option
        .setName("circle")
        .setDescription("The circle to check for inactivity.")
        .setRequired(true)
    );
  }

  protected buildSlashCommand() {}

  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    const circleName = interaction.options.getString("circle")!;
    const circle = bot.managers.database.cache.circles.find(
      (circle) => circle.name?.toLowerCase() === circleName?.toLowerCase()
    );
    if (!circle) {
      await interaction.reply({
        content: "Circle not found.",
        ephemeral: true,
      });
      return;
    }
    const channel = bot.channels.cache.get(circle.id) as TextChannel;

    const messages = await channel.messages.fetch({ limit: 100 });
  }
}
