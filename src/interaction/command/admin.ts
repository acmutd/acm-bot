import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import assert from "assert";

export default class AdminCommand extends SlashCommand {
  public constructor() {
    super({
      name: "admin",
      description: "Staff commands",
      permissions: 0,
    });
    this.slashCommand.addSubcommand((subcommand) =>
      subcommand
        .setName("lookup")
        .setDescription("Look up a user's name")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to look up")
            .setRequired(true)
        )
    );
  }

  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    assert(interaction.options.getSubcommand() == "lookup");

    const user = interaction.options.getUser("user")!;

    const nameMappingReq = await bot.managers.firestore.firestore
      ?.collection("discord")
      .doc("snowflake_to_name")
      .get();
    if (!nameMappingReq) return;
    const nameMapping = nameMappingReq.data();

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
