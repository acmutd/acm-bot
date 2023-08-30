import { ActionRowBuilder, TextInputBuilder } from "@discordjs/builders";
import BaseModal from "../../api/interaction/modal";
import { TextInputStyle } from "discord.js";

export default class MessageModal extends BaseModal {
  public constructor() {
    super({
      title: "Message",
      custom_id: "message-modal",
      components: [],
    });

    const messageActionRow = new ActionRowBuilder<TextInputBuilder>();
    const textInput = new TextInputBuilder()
      .setCustomId("message-text")
      .setPlaceholder("Message text")
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(1)
      .setMaxLength(1000)
      .setLabel("Message text")
      .setRequired(true);

    messageActionRow.addComponents(textInput);
    this.addComponents(messageActionRow);
  }
}
