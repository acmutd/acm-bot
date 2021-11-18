import Event from "../api/event";
import Bot from "../api/bot";
import { MessageReaction, User } from "discord.js";

export default class MessageReactionAddEvent extends Event {
  constructor(bot: Bot) {
    super(bot, "messageReactionAdd");
  }

  public async emit(bot: Bot, reaction: MessageReaction, user: User) {
    bot.managers.points.handleReactionAdd(reaction, user);
    bot.managers.circle.handleReactionAdd(reaction, user);
    bot.managers.rero.handleReactionAdd(reaction, user);
  }
}
