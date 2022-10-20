import CustomButtonInteraction, {
  ButtonInteractionContext
} from "../../api/interaction/button";

export default class VerificationButton extends CustomButtonInteraction {
  public constructor() {
    super({
      name: "verification-button",
    });
  }

  public matchCustomId(customId: string) {
    return customId === "verification-button";
  }

  public async handleInteraction({
    bot,
    interaction,
  }: ButtonInteractionContext): Promise<void> {
    await bot.managers.verification.handleVerificationRequest(interaction);
  }
}
