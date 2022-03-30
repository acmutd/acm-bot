import SlashCommand from "../api/slashcommand";
import { InteractionContext } from "../api/interaction";

export default class BeepCommand extends SlashCommand {
  public constructor() {
    super({
      name: "beep",
      description: "Beep boop I'm a bot",
    });
  }

  public async handleInteraction({
    bot,
    interaction,
  }: InteractionContext): Promise<void> {
    if (!interaction.isCommand()) return;

    await interaction.reply("🤖 boop! 🤖");
  }
}
