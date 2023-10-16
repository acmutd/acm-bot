import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { ActionRowBuilder } from "@discordjs/builders";

export default class VerificationCommand extends SlashCommand {
  public constructor() {
    super({
      name: "verification",
      description: "Send the verification button to the verify chat",
    });
  }

  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    const verChanID = bot.settings.channels.verification;
    const verificationChannel = bot.channels.cache.get(verChanID);
    if (!verificationChannel || !verificationChannel.isTextBased()) {
      await interaction.reply({
        content:
          "Could not properly send the verification message. Please contact an administrator.",
        ephemeral: true,
      });
      bot.managers.error.handleErr(
        new Error("Could not find verification channel")
      );
      return;
    }

    const messages = await verificationChannel.messages.fetch({ limit: 100 });
    const botMessages = messages.filter((msg) => msg.author.bot);
    for (const [_, message] of botMessages) {
      await message.delete();
    }

    const embed = new EmbedBuilder()
      .setTitle("Verification")
      .setDescription("Click the button below to verify")
      .addFields([
        {
          name: "Instructions",
          value: "Click the button below and enter your first & last name",
        },
        {
          name: "Additional",
          value:
            "You can also enter your pronouns, just make sure the total message is less than 32 characters",
        },
      ]);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder({
        label: "Verify",
        custom_id: "verify/start",
        style: ButtonStyle.Primary,
      })
    );

    await verificationChannel.send({
      embeds: [embed],
      components: [row],
    });
    await interaction.reply({
      content: "Sent the verification message!",
      ephemeral: true,
    });
  }
}
