import CustomButtonInteraction, {
  ButtonInteractionContext,
} from "../../api/interaction/button";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import * as assert from "assert";

export default class ReportButton extends CustomButtonInteraction {
  public constructor() {
    super({
      name: "report-button",
    });
  }

  public matchCustomId(customId: string) {
    return customId.startsWith("report/");
  }

  public async handleInteraction({
    bot,
    interaction,
  }: ButtonInteractionContext): Promise<void> {
    await bot.managers.report.handleCategorySelection(interaction);
  }
}
