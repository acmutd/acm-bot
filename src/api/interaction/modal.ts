import { ModalBuilder } from "@discordjs/builders";
import { APIModalInteractionResponseCallbackData } from "discord.js";

import BaseInteraction, { InteractionContext } from "./interaction";

export interface ModalConfig
  extends Partial<APIModalInteractionResponseCallbackData> {}

export default abstract class BaseModal
  extends ModalBuilder
  implements BaseInteraction
{
  public readonly name: string;

  constructor(config: ModalConfig) {
    super();
    if (config.title) this.setTitle(config.title);
    if (config.custom_id) this.setCustomId(config.custom_id);
    this.name = "Modal";
  }

  public async handleInteraction({
    bot,
    interaction,
  }: InteractionContext): Promise<void> {
    if (!interaction.isModalSubmit()) {
      throw new Error("Not a modal submit");
    }
    if (interaction.customId === "report-text") {
      await interaction.editReply("Your report has been submitted.");
      const text = interaction.fields.getField("report-text");
    }
  }
}
