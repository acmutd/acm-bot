import ContextMenuCommand, {
  ContextMenuCommandContext,
} from "../../api/interaction/contextmenucommand";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { v4 } from "uuid";
import * as assert from "assert";

export default class ReportContextMenuCommand extends ContextMenuCommand {
  public constructor() {
    super({
      name: "Report Message",
      type: 3, // TODO: fix this when discord.js gets gud (tsc doesnt like the actual type)
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
    // Ensure this is a message (just for the ts assert)
    assert.ok(interaction.isMessageContextMenu());

    await bot.managers.report.handleInitialReport(interaction);
  }
}
