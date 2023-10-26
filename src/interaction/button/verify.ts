import CustomButtonInteraction, {
  ButtonInteractionContext,
} from "../../api/interaction/button";

export default class VerifyButton extends CustomButtonInteraction {
  public constructor() {
    super({
      name: "verify-button",
    });
  }

  public matchCustomId(customId: string) {
    return customId.startsWith("verify/");
  }

  public async handleInteraction({
    bot,
    interaction,
  }: ButtonInteractionContext): Promise<void> {
    await bot.managers.verification.handle(interaction);
  }
}
