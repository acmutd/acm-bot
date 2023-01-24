import { schemaTypes, SchemaTypes } from "./../../util/manager/database";
import { CIRCLE_PERMS } from "./../../util/perms";
import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";

export default class RecacheCommand extends SlashCommand {
  public constructor() {
    super({
      name: "recache",
      description: "Recache the bot's data",
      permissions: CIRCLE_PERMS,
    });
    this.slashCommand.addStringOption((option) =>
      option
        .addChoices(...schemaTypes.map((type) => ({ name: type, value: type })))
        .setName("type")
        .setDescription("The type of data to recache")
        .setRequired(true)
    );
  }

  public async handleInteraction({ bot, interaction }: SlashCommandContext) {
    const type = interaction.options.getString("type", true);
    if (!isSchemaType(type))
      return interaction.reply({ ephemeral: true, content: "Invalid type" });
    await interaction.reply({ ephemeral: true, content: "Caching" });
    if (await bot.managers.database.manualRecache(type))
      return interaction.editReply("Recached");
    return interaction.editReply("Failed to recache");
  }
}

function isSchemaType(schema: string): schema is schemas {
  return schemaTypes.includes(schema);
}

type schemas = keyof SchemaTypes;
