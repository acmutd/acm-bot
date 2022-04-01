import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { InteractionContext } from "../../api/interaction/interaction";
import ContextMenuCommand, {
  ContextMenuCommandContext,
} from "../../api/interaction/contextmenucommand";
import { ApplicationCommandType } from "discord-api-types";
import { ContextMenuCommandType } from "@discordjs/builders";

export default class ReportContextMenuCommand extends ContextMenuCommand {
  public constructor() {
    super({
      name: "report",
      type: 3, // TODO: fix this when discord.js gets gud
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
  }: ContextMenuCommandContext): Promise<void> {
    // Build prompt window to collect more information

    await interaction.reply({ content: "Your report for ", ephemeral: true });
  }
}
