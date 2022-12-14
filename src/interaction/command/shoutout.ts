import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { TextChannel } from "discord.js";

import { settings } from "../../settings";
import { EmbedBuilder } from "@discordjs/builders";

export default class ShoutoutCommand extends SlashCommand {
  public constructor() {
    super({
      name: "shoutout",
      description: "Shout out someone special.",
    });
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
    const users = options.get("users", true).value as string;
    const shoutout = options.get("shoutout", true).value as string;

    let embed = new EmbedBuilder({
      title: "Shouting out User(s)",
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });

    const title = `📣 ${member!.user.username} gave a shoutout!`;

    embed = new EmbedBuilder({
      title,
      fields: [
        { name: "Given to:", value: users },
        { name: "For:", value: shoutout },
      ],
    });

    const channel = guild!.channels.resolve(
      settings.channels.shoutout
    ) as TextChannel;
    await channel.send({ content: users, embeds: [embed] });
  }
}
