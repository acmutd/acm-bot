import Manager from "../../api/manager";
import Bot from "../../api/bot";
import DynamicLoader from "../dynamicloader";
import Event from "../../api/event";

declare function require(name: string): any;

export default class EventManager extends Manager {
  public path: string;

  constructor(bot: Bot, path: string) {
    super(bot);
    this.path = path;
  }

  public async init() {
    const classes = (await DynamicLoader.loadClasses(this.path, [
      this.bot,
    ])) as Event[];
    classes.forEach((event) => {
      this.bot.on(event.name, event.emit.bind(null, this.bot));
      this.bot.logger.info(`Loaded event '${event.name}'`);
    });
  }
}
