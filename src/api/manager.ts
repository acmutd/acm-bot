import Bot from "./bot";

export default abstract class Manager {
  public bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  /**
   * Initialize anything required for this manager to work.
   */
  public abstract init(): void;
}
