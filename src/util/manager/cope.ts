import { MessageReaction, TextChannel, User } from "discord.js";
import Bot from "../../api/bot";
import Manager from "../../api/manager";

export default class CopeManager extends Manager {
  constructor(bot: Bot) {
    super(bot);
  }

  public async init(): Promise<void> {}

  async handleReactionAdd(reaction: MessageReaction) {
    // Handle partial
    if (reaction.partial) await reaction.fetch();
    // Ignore some reactions we shouldn't care about
    if (!reaction.emoji.name!.toLowerCase().includes("cope")) return;
    await reaction.users.fetch();
    if (!reaction.message.guild) return;

    const id = reaction.message.author!.id;
    await this.bot.managers.database.coperIncrement(id);
  }
}
