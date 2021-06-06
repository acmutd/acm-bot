import Bot from './bot'

export default abstract class Event {
    public bot: Bot
    public name: string

    constructor(bot: Bot, event: string) {
        this.bot = bot
        this.name = event
    }

    public abstract emit(...args: any[]): void
}