import { User, Collection } from 'discord.js';

// ! USE REDIS THIS IS SUCH AN INEFFICIENT SYSTEM OMFG

export type IndicatorType = 'usingCommand' | 'reacting';

export default class IndicatorManager {
    private indicators: Collection<string, Array<string>>;

    constructor() {
        this.indicators = new Collection();
    }

    public hasUser(indicator: IndicatorType, user: User): boolean {
        if (!this.indicators.has(indicator)) return false;
        return this.indicators.get(indicator)!.includes(user.id);
    }

    public addUser(indicator: IndicatorType, user: User) {
        if (!this.indicators.has(indicator)) this.indicators.set(indicator, []);
        return this.indicators.get(indicator)!.push(user.id);
    }

    public removeUser(indicator: IndicatorType, user: User) {
        if (!this.indicators.has(indicator)) return;
        return this.indicators.set(
            indicator,
            this.indicators.get(indicator)!.filter((id) => id != user.id)
        );
    }
}
