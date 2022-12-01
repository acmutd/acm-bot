import Event from "../api/event";
import Bot from "../api/bot";

export default class ReadyEvent extends Event {
  constructor(bot: Bot) {
    super(bot, "ready");
  }

  public async emit(bot: Bot) {
    if (bot.user) {
      // Print login info
      bot.logger.info(
        `Logged in as ${bot.user.username}#${bot.user.discriminator}!`
      );

      // Set status
      bot.user.setActivity(bot.settings.activity.description, {
        type: bot.settings.activity.type,
      });
    }
  }
}
