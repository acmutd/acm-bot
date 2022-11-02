import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";

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
  }: SlashCommandContext): Promise<void> {
    await interaction.reply("🤖 boop! 🤖");
  }
}
