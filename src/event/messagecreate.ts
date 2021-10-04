import Event from "../api/event";
import Bot from "../api/bot";
import { Message } from "discord.js";

export default class MessageCreateEvent extends Event {
  constructor(bot: Bot) {
    super(bot, "messageCreate");
  }

  public emit(bot: Bot, msg: Message): void {
    bot.managers.command.handle(msg);
    bot.managers.verification.handle(msg);
  }
}
