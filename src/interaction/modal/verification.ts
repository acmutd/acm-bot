import CustomModalInteraction, {
  ModalInteractionContext,
} from "../../api/interaction/modal";

export default class VerificationModal extends CustomModalInteraction {
  public constructor() {
    super({
      name: "verification-modal",
    });
  }

  public matchCustomId(customId: string) {
    return customId === "verification-modal";
  }

  public async handleInteraction({
    bot,
    interaction,
  }: ModalInteractionContext): Promise<void> {
    // Forward to circle handler
    await bot.managers.verification.handleVerificationSubmit(interaction);
  }
}
