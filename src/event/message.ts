import Event from "../api/event";
import Bot from "../api/bot";
import { Message } from "discord.js";

export default class MessageEvent extends Event {
  constructor(bot: Bot) {
    super(bot, "message");
  }

  public emit(bot: Bot, msg: Message): void {
    bot.managers.command.handle(msg);
  }
}
