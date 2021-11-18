import BaseInteraction, { InteractionContext } from "../api/interaction";

export default class BeepHandler extends BaseInteraction {
  constructor() {
    super({
      name: "beep",
    });
  }

  public async exec({ bot, interaction }: InteractionContext): Promise<void> {
    if (!interaction.isCommand()) return;

    await interaction.reply("boop!");
  }
}
