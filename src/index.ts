import Bot from "./api/bot";
import * as path from "path";
import { settings } from "./settings";
import sourceMapSupport from "source-map-support";

sourceMapSupport.install({
  handleUncaughtExceptions: false,
});

const bot: Bot = new Bot({
  token: settings.token,
  dbUrl: settings.databaseURL,
  sentryDNS: settings.sentryDNS,
  commandPath: path.join(process.cwd(), "dist", "command"),
  eventPath: path.join(process.cwd(), "dist", "event"),
  endpointPath: path.join(process.cwd(), "dist", "endpoint"),
  responseFormat: settings.responseFormat,
  disabledCommands: settings.disabledCommands,
  disabledCategories: settings.disabledCategories,
});

bot.start();
