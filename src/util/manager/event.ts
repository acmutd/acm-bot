import { Collection } from "discord.js";
import Manager from "../../api/manager";
import Command from "../../api/command";
import Bot from "../../api/bot";
import * as fs from "fs";

declare function require(name: string): any;

export default class EventManager extends Manager {
  public path: string;

  constructor(bot: Bot, path: string) {
    super(bot);
    this.path = path;
  }
  public init(): void {
    fs.readdir(this.path, (err, files) => {
      this.bot.logger.info(`Found ${files.length} event(s)...`);
      files.forEach((file) => {
        const e = require(`${
          this.path.endsWith("/") ? this.path : this.path + "/"
        }${file}`);
        const event = new e.default(this.bot);
        this.bot.on(event.name, event.emit.bind(null, this.bot));
        this.bot.logger.info(`Loaded event '${event.name}'`);
      });
    });
  }
}
