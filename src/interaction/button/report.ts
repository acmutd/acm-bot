import CustomButtonInteraction, {
  ButtonInteractionContext,
} from "../../api/interaction/button";

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
