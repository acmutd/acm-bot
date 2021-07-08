import { Message } from "discord.js";
import Command, { CommandContext } from "../api/command";
export default class PingCommand extends Command {
  constructor() {
    super({
      name: "ping",
      description: "Fetch the bot's response time...",
    });
  }
  public exec({ msg, bot, args }: CommandContext): void {
    const startTime = new Date().getTime();
    msg.channel
      .send("Ping: This message should be deleted...")
      .then((m) => m.delete());
    bot.response.emit(
      msg.channel,
      `:ping_pong: | ${
        (new Date().getTime() - startTime) / 1000
      }s response time...`,
      "success"
    );
  }
}
