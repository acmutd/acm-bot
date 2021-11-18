import BaseInteraction, { InteractionContext } from "../api/interaction";
import assert from "assert";

export default class LookupHandler extends BaseInteraction {
  constructor() {
    super({
      name: "admin",
    });
  }

  public async exec({ bot, interaction }: InteractionContext): Promise<void> {
    if (!interaction.isCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    assert(interaction.options.getSubcommand() == "lookup");

    const user = interaction.options.getUser("user");

    const nameMapping = (
      await bot.managers.firestore.firestore
        ?.collection("discord")
        .doc("snowflake_to_name")
        .get()
    ).data();

    for (const snowflake in nameMapping) {
      if (user.id == snowflake) {
        await interaction.editReply(
          `<@${user.id}>'s name is ${nameMapping[snowflake]}`
        );
        return;
      }
    }

    await interaction.editReply(`<@${user.id}> is unregistered.`);
  }
}
