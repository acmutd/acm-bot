import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { MessageEmbed, TextChannel } from "discord.js";
import { settings } from "../../settings";
import { APIEmbedField } from "discord-api-types";

export default class CopersCommand extends SlashCommand {
  public constructor() {
    super({
      name: "copers",
      description: "Find out who's coping.",
    });
  }

  protected buildSlashCommand() {
    this.slashCommand;
  }

  // Interaction Handled !
  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    const { member, guild } = interaction;

    let embed = new MessageEmbed({
      title: "Fetching copers...",
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });

    const copers = await bot.managers.database.copersFetch();

    const title = `📣 ${member!.user.username} found some copers!`;

    embed = new MessageEmbed({
      title,
      fields: copers.map((coper, i) => {
        return {
          name: ["1st", "2nd", "3rd", "4th", "5th"][i],
          value: `<@${coper[0]}> : ${coper[1]} copium`,
        };
      }) as unknown as APIEmbedField[],
      color: "RANDOM",
    });

    const channel = guild!.channels.resolve(
      settings.channels.shoutout
    ) as TextChannel;
    await channel.send({ embeds: [embed] });
  }
}
