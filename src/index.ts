import Bot from "./api/bot";
import * as path from "path";
import { settings } from "./settings";

const bot: Bot = new Bot({
  token: settings.token,
  dbUrl: settings.databaseURL,
  sentryDNS: settings.sentryDNS,
  commandPath: path.join(process.cwd(), "dist", "command"),
  eventPath: path.join(process.cwd(), "dist", "event"),
  responseFormat: settings.responseFormat,
  disabledCommands: settings.disabledCommands,
  disabledCategories: settings.disabledCategories,
});

bot.start();
