import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import assert from "assert";
import { InteractionContext } from "../../api/interaction/interaction";
import {
  ChatInputApplicationCommandData,
  CommandInteraction,
} from "discord.js";

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
    assert(interaction.options.getSubcommand() === "lookup");

    const user = interaction.options.getUser("user", true);

    const nameMappingReq = await bot.managers.firestore.firestore
      ?.collection("discord")
      .doc("snowflake_to_name")
      .get();
    if (!nameMappingReq || !nameMappingReq.exists) {
      await interaction.reply({
        content: `<@${user.id}> is unregistered.`,
        ephemeral: true,
      });
      return;
    }
    const nameMapping = nameMappingReq.data();

    const name = nameMapping?.[user.id];
    if (!name) {
      await interaction.reply({
        content: `<@${user.id}> is unregistered.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `<@${user.id}> is ${name}.`,
      ephemeral: true,
    });
  }
}
