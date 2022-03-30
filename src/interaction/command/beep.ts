import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { InteractionContext } from "../../api/interaction/interaction";

export default class BeepCommand extends SlashCommand {
  public constructor() {
    super({
      name: "beep",
      description: "Beep boop I'm a bot",
    });
  }

  /**
   * Simple command, additional customizations
   * @protected
   */
  protected buildSlashCommand() {}

  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    await interaction.reply("🤖 boop! 🤖");
  }
}
