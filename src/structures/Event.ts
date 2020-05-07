import Bot from "./Bot";


export default abstract class Event {
    public bot: Bot;
    public name: string;

    constructor(bot: Bot, event: string) {
        this.bot = bot;
        this.name = event;
    }

    public async abstract emit(...args: any[]): Promise<any>;
}