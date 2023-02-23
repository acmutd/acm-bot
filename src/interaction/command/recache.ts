import { CIRCLE_PERMS } from "./../../util/perms";
import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { schemaTypes } from "../../util/manager/firestore";

const schemas = schemaTypes.options;
export default class RecacheCommand extends SlashCommand {
  public constructor() {
    super({
      name: "recache",
      description: "Recache the bot's data",
      permissions: CIRCLE_PERMS,
    });
    this.slashCommand.addStringOption((option) =>
      option
        .addChoices(
          ...schemas.map((schema) => ({ name: schema, value: schema }))
        )
        .setName("type")
        .setDescription("The type of data to recache")
        .setRequired(true)
    );
  }

  public async handleInteraction({ bot, interaction }: SlashCommandContext) {
    const temp = interaction.options.getString("type", true);
    const type = schemaTypes.safeParse(temp);
    if (!type.success)
      return interaction.reply({ ephemeral: true, content: "Invalid type" });
    await interaction.reply({ ephemeral: true, content: "Caching" });
    if (await bot.managers.firestore.manualRecache(type.data))
      return interaction.editReply("Recached");
    return interaction.editReply("Failed to recache");
  }
}
