import ACMClient from "./structures/Bot";
import * as path from "path";
import { settings } from "./botsettings";

let client: ACMClient = new ACMClient({
  // token: process.env.TOKEN!,
  token: settings.token,
  dbUrl: settings.databaseURL,
  sentryDSN: settings.sentryDNS,
  commandPath: path.join(process.cwd(), "dist", "commands"),
  eventPath: path.join(process.cwd(), "dist", "events"),
  responseFormat: settings.responseFormat,
  disabledCommands: settings.disabledCommands,
  disabledCategories: settings.disabledCategories,
});

client.start();
