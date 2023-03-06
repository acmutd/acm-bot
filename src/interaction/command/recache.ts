import { PermissionFlagsBits } from "discord.js";
import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { cacheKeys } from "../../util/manager/firestore";

const schemas = cacheKeys.options;
export default class RecacheCommand extends SlashCommand {
  public constructor() {
    super({
      name: "recache",
      description: "Recache the bot's data",
      permissions: PermissionFlagsBits.Administrator,
    });
    this.slashCommand.addStringOption((option) =>
      option
        .addChoices(
          // Slightly scuffed cause it has to be spread into an array
          ...schemas.map((schema) => ({ name: schema, value: schema }))
        )
        .setName("type")
        .setDescription("The type of data to recache")
        .setRequired(true)
    );
  }

  public async handleInteraction({ bot, interaction }: SlashCommandContext) {
    const unParsed = interaction.options.getString("type", true);
    const type = cacheKeys.safeParse(unParsed);

    if (!type.success)
      return interaction.reply({ ephemeral: true, content: "Invalid type" });
    await interaction.reply({ ephemeral: true, content: "Caching" });
    if (await bot.managers.firestore.manualRecache(type.data))
      return interaction.editReply("Recached");
    return interaction.editReply("Failed to recache");
  }
}
