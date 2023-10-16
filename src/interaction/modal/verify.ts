import { ActionRowBuilder, TextInputBuilder } from "@discordjs/builders";
import { TextInputStyle } from "discord-api-types/v10";
import BaseModal from "../../api/interaction/modal";

export default class VerifyModal extends BaseModal {
  public constructor() {
    super({
      title: "Verify",
      custom_id: "verify-modal",
      components: [],
    });
    const messageActionRow = new ActionRowBuilder<TextInputBuilder>();
    const textInput = new TextInputBuilder()
      .setCustomId("verify-text")
      .setPlaceholder("Set Name")
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(1)
      .setMaxLength(32)
      .setLabel("Set name")
      .setRequired(true);
    messageActionRow.addComponents(textInput);
    this.addComponents(messageActionRow);
  }
}
