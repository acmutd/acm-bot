import { ActionRowBuilder, TextInputBuilder } from "@discordjs/builders";
import { TextInputStyle } from "discord-api-types/v10";
import BaseModal from "../../api/interaction/modal";

export default class ReportModal extends BaseModal {
  public constructor() {
    super({
      title: "Report",
      custom_id: "report-modal",
      components: [],
    });
    const messageActionRow = new ActionRowBuilder<TextInputBuilder>();
    const textInput = new TextInputBuilder()
      .setCustomId("report-text")
      .setPlaceholder("Report text")
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(1)
      .setMaxLength(1000)
      .setLabel("Report text")
      .setRequired(true)
      .setValue("test");
    messageActionRow.addComponents(textInput);
    this.addComponents(messageActionRow);
  }
}
