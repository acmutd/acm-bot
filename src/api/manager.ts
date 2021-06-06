import Bot from './bot'

export default abstract class Manager {
    public bot: Bot
    constructor(bot: Bot) {
        this.bot = bot
    }
    public abstract init(): void
}