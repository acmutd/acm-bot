import Event from "../api/event";
import Bot from "../api/bot";
import { Message } from "discord.js";

export default class MessageCreateEvent extends Event {
  constructor(bot: Bot) {
    super(bot, "messageCreate");
  }

  public async emit(bot: Bot, msg: Message): Promise<void> {
    await bot.managers.command.handle(msg);
  }
}
