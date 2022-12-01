import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { InteractionContext } from "../../api/interaction/interaction";
import { EmbedBuilder } from "discord.js";

export default class ReportCommand extends SlashCommand {
  public constructor() {
    super({
      name: "report",
      description:
        "Show instructions to report a message to the ACM moderators.",
    });
  }

  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    let embed = new EmbedBuilder({
      title: "How to report an offending message",
      description:
        "Right click the message > `Apps` > `Report Message`\n" +
        "You may be asked to provide details.",
      image: {
        url: "https://i.imgur.com/vSBEZct.png",
      },
    });
    // Send embed with instructions on reporting a specific message
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
