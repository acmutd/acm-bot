import CustomButtonInteraction, {
  ButtonInteractionContext,
} from "../../api/interaction/button";

export default class CircleButton extends CustomButtonInteraction {
  public constructor() {
    super({
      name: "circle-button",
    });
  }

  public matchCustomId(customId: string) {
    return customId.startsWith("circle/");
  }

  public async handleInteraction({
    bot,
    interaction,
  }: ButtonInteractionContext): Promise<void> {
    // Forward to circle handler
    await bot.managers.circle.handleButton(interaction);
  }
}
