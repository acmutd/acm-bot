import Command, { CommandContext } from "../api/command";

export default class RemindCommand extends Command {
  constructor() {
    super({
      name: "remind",
      description: "Setup a timed reminder...",
      usage: ["remind [minutes] [message]"],
    });
  }

  public async exec({ msg, bot, args }: CommandContext) {
    if (args.length < 2) return this.sendInvalidUsage(msg, bot);

    const minutes = parseInt(args[0]);
    const message = args[1];
    const maxTime = 6 * 7 * 24 * 60;
    if (isNaN(minutes) || minutes < 1 || minutes > maxTime)
      return bot.response.emit(
        msg.channel,
        `Invalid time in range [1-${maxTime}]...`,
        "invalid"
      );

    const date = new Date(Date.now() + minutes * 60_000);

    const options: Intl.DateTimeFormatOptions = {
      timeZone: "America/Chicago",
      timeZoneName: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };

    const dateStr = date.toLocaleString("en-US", options);

    bot.managers.scheduler.createTask({
      cron: date,
      type: "reminder",
      payload: {
        message,
        id: msg.author.id,
      },
    });
    return bot.response.emit(
      msg.channel,
      `${msg.author}, I'll DM you with your reminder at '${dateStr}'...`,
      "success"
    );
  }
}
