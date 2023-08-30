import { PermissionFlagsBits } from "discord.js";
import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import MessageModal from "../modal/message";

export default class AnonMessage extends SlashCommand {
  public constructor() {
    super({
      name: "anon-message",
      description: "Send an anonymous message to staff",
      permissions: PermissionFlagsBits.SendMessages,
    });
  }

  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    const modal = new MessageModal();

    await interaction.showModal(modal);

    try {
      const res = await interaction.awaitModalSubmit({
        time: 20000,
        idle: 20000,
      });

      const message = res.fields.getTextInputValue("message-text");

      const channel = await bot.channels.fetch(bot.settings.channels.mod);
      if (!channel || !channel.isTextBased())
        throw new Error("Channel not found");

      const msgString = `**Anon Message**\n${message}`;
      await channel.send({
        content: msgString,
      });

      await res.reply({
        content: "Your message has been submitted.",
        ephemeral: true,
      });
    } catch (e) {
      if (!interaction.replied)
        await interaction.reply({
          content: "An error occurred while trying to send your message.",
          ephemeral: true,
        });
      else
        await interaction.followUp({
          content: "An error occurred while trying to send your message.",
          ephemeral: true,
        });
      bot.logger.error(JSON.stringify(e));
    }
  }
}
