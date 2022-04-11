import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { InteractionContext } from "../../api/interaction/interaction";
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
    const users = options.getString("users");
    const shoutout = options.getString("shoutout");

    let embed = new MessageEmbed({
      title: "Shouting out User(s)",
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });

    const title = `📣 ${member.user.username} gave a shoutout!`;

    const reg = /^.*?(<@!?[\d]{17,18}>|\s)+/;
    const text = shoutout.replace(reg, "");
    embed = new MessageEmbed({
      title,
      fields: [
        {
          name: "Given to:",
          value: users.match(reg)![0].replace(settings.prefix + "shoutout", ""),
        },
        {
          name: "For:",
          value: text,
        },
      ],
      color: "RANDOM",
    });

    const channel = guild.channels.resolve(
      settings.channels.shoutout
    ) as TextChannel;
    await channel.send({ embeds: [embed] });
  }
}
