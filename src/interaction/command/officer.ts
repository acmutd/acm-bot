import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { MessageEmbed, TextChannel } from "discord.js";
import { settings } from "../../settings";

export default class OfficerCommand extends SlashCommand {
  public constructor() {
    super({
      name: "officer",
      description: "officer command suite",
    });
  }

  protected buildSlashCommand() {
    this.slashCommand
    .addSubcommand((subcommand) =>
      subcommand
        .addBooleanOption((option) =>
          option
            .setName("form")
            .setDescription("Is it a form?")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("link")
            .setDescription("link for url")
            .setRequired(true)
        )
      );
  }

  // Interaction Handled !
  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    const { options, member, guild } = interaction;
    const form = options.getBoolean("users")!;
    const link = options.getString("link")!;

    let embed = new MessageEmbed({
      title: "Shouting out User(s)",
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });

    const title = `📣 ${member!.user.username} gave a shoutout!`;

    embed = new MessageEmbed({
      title,
      fields: [
        {
          name: "Given to:",
          value: String(form),
        },
        {
          name: "For:",
          value: link,
        },
      ],
      color: "RANDOM",
    });

    const channel = guild!.channels.resolve(
      settings.channels.shoutout
    ) as TextChannel;
    await channel.send({ embeds: [embed] });
  }
}
