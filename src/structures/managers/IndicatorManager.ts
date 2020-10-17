import { User, Collection } from 'discord.js';

// ! USE REDIS THIS IS SUCH AN INEFFICIENT SYSTEM OMFG

export type IndicatorType = 'usingCommand' | 'reacting';
export type IndicatorCacheType = 'textActivity' | 'voiceEvent' | 'reactionEvent';

export default class IndicatorManager {
    private indicators: Collection<string, Array<string>>;
    private indicatorCache: Collection<string, Collection<string, any>>;

    // for text activity monitoring, 'textActivity' → (userID → lastMessageTimestamp)
    // for voice channel monitoring, 'voiceEvent'→ (voiceChannelID → [userID, userId, ...])

    constructor() {
        this.indicators = new Collection();
        this.indicatorCache = new Collection();
    }

    // indicator methods
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
    
    // indicator cache methods
    public getEntireCache(indicator: IndicatorCacheType): Collection<string, any> | undefined {
        if (!this.indicatorCache.has(indicator)) return;
        return this.indicatorCache.get(indicator)!;
    }

    public hasKey(indicator: IndicatorCacheType, key: string): boolean {
        if (!this.indicatorCache.has(indicator)) return false;
        return this.indicatorCache.get(indicator)!.has(key);
    }

    public getValue(indicator: IndicatorCacheType, key: string): any | undefined {
        if (!this.indicatorCache.has(indicator)) return;
        return this.indicatorCache.get(indicator)!.get(key);
    }

    public setKeyValue(indicator: IndicatorCacheType, key: string, value: any) {
        if (!this.indicatorCache.has(indicator)) this.indicatorCache.set(indicator, new Collection);
        return this.indicatorCache.get(indicator)!.set(key, value);
    }

    public removeKey(indicator: IndicatorCacheType, key: string) {
        if (!this.indicatorCache.has(indicator)) return;
        return this.indicatorCache.get(indicator)!.delete(key);
    }
}
