import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { MessageEmbed, TextChannel } from "discord.js";
import { settings } from "../../settings";

export default class ShoutoutCommand extends SlashCommand {
  public constructor() {
    super({
      name: "shoutout",
      description: "Shout out someone special.",
    });
  }

  protected buildSlashCommand() {
    this.slashCommand
      .addStringOption((option) =>
        option
          .setName("users")
          .setDescription("Users to shoutout")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("shoutout")
          .setDescription("Shoutout message")
          .setRequired(true)
      );
  }

  // Interaction Handled !
  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    const { options, member, guild } = interaction;
    const users = options.getString("users")!;
    const shoutout = options.getString("shoutout")!;

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
          value: users,
        },
        {
          name: "For:",
          value: shoutout,
        },
      ],
      color: "RANDOM",
    });

    const channel = guild!.channels.resolve(
      settings.channels.shoutout
    ) as TextChannel;
    await channel.send({ embeds: [embed] });
    await channel.send(`${users}`);
  }
}
