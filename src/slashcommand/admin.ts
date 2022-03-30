import SlashCommand from "../api/slashcommand";
import { InteractionContext } from "../api/interaction";
import assert from "assert";

export default class AdminCommand extends SlashCommand {
  public constructor() {
    super({
      name: "admin",
      description: "Staff commands",
      permissions: [
        {
          id: "312383932870033408",
          type: "USER",
          permission: true,
        },
      ],
    });
  }

  buildSlashCommand() {
    super.buildSlashCommand();
    this.slashCommand
      .addSubcommand((subcommand) =>
        subcommand
          .setName("lookup")
          .setDescription("Look up a user's name")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("User to look up")
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("foobar").setDescription("test")
      );
  }

  public async handleInteraction({
    bot,
    interaction,
  }: InteractionContext): Promise<void> {
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
      if (nameMapping.hasOwnProperty(snowflake) && user.id == snowflake) {
        await interaction.editReply(
          `<@${user.id}>'s name is ${nameMapping[snowflake]}`
        );
        return;
      }
    }

    await interaction.editReply(`<@${user.id}> is unregistered.`);
  }
}
