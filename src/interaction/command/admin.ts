import assert from "assert";
import { ChannelType } from "discord.js";

import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";

export default class AdminCommand extends SlashCommand {
  public constructor() {
    super({
      name: "admin",
      description: "Staff commands",
      permissions: 0,
    });
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
        subcommand
          .setName("verify")
          .setDescription("Verify all users in the verification channel")
      );
  }

  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    switch (interaction.options.getSubcommand()) {
      case "lookup":
        await this.lookupUser({ bot, interaction });
        break;
      case "verify":
        await this.verifyAll({ bot, interaction });
        break;
      default:
        assert.fail("Unknown subcommand");

        break;
    }
  }

  private async verifyAll({ bot, interaction }: SlashCommandContext) {
    const verificationChannel = await bot.channels.fetch(
      bot.settings.channels.verification
    );
    if (!verificationChannel || verificationChannel.isVoiceBased()) {
      return await interaction.reply({
        content: "Verification channel is not a text channel.",
        ephemeral: true,
      });
    }

    if (verificationChannel.type !== ChannelType.GuildText) {
      return await interaction.reply({
        content: "Verification channel is not a text channel.",
        ephemeral: true,
      });
    }
    // Fetch all messages in the verification channel
    const messages = await verificationChannel.messages.fetch({ limit: 50 });

    const verificationMessages = messages.filter((msg) => {
      if (!msg.member) return false;
      if (msg.content.length > 32) return false;
      return true;
    });

    await interaction.reply({
      content: `Verified ${verificationMessages.size} users.`,
      ephemeral: true,
    });
  }

  private async lookupUser({ bot, interaction }: SlashCommandContext) {
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
