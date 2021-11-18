import Manager from "../../api/manager";
import Bot from "../../api/bot";
import * as fs from "fs";
import DynamicLoader from "../dynamicloader";

declare function require(name: string): any;

export default class EventManager extends Manager {
  public path: string;

  constructor(bot: Bot, path: string) {
    super(bot);
    this.path = path;
  }

  public init(): void {
    DynamicLoader.loadClasses(this.path, [this.bot]).forEach((event) => {
      this.bot.on(event.name, event.emit.bind(null, this.bot));
      this.bot.logger.info(`Loaded event '${event.name}'`);
    });
  }
}
