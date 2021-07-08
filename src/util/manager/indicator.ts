import { User, Collection } from "discord.js";
import Bot from "../../api/bot";
import Manager from "../../api/manager";

export type IndicatorType = "usingCommand" | "reacting";
export type IndicatorCacheType =
  | "textActivity"
  | "voiceEvent"
  | "reactionEvent";

export default class IndicatorManager extends Manager {
  private indicators: Collection<string, Array<string>>;
  private indicatorCache: Collection<string, Collection<string, any>>;

  constructor(bot: Bot) {
    super(bot);
    this.indicators = new Collection();
    this.indicatorCache = new Collection();
  }

  public init(): void {}

  public hasUser(indicator: IndicatorType, user: User): boolean {
    return (
      this.indicators.has(indicator) &&
      this.indicators.get(indicator)!.includes(user.id)
    );
  }
  public addUser(indicator: IndicatorType, user: User): void {
    if (!this.indicators.has(indicator)) this.indicators.set(indicator, []);
    this.indicators.get(indicator)!.push(user.id);
  }
  public removeUser(indicator: IndicatorType, user: User): void {
    if (!this.indicators.has(indicator)) return;
    this.indicators.set(
      indicator,
      this.indicators.get(indicator)!.filter((id) => id != user.id)
    );
  }
  public getCache(
    indicator: IndicatorCacheType
  ): Collection<string, any> | undefined {
    if (!this.indicatorCache.has(indicator)) return;
    return this.indicatorCache.get(indicator)!;
  }
  public hasKey(indicator: IndicatorCacheType, key: string): boolean {
    return (
      this.indicatorCache.has(indicator) &&
      this.indicatorCache.get(indicator)!.has(key)
    );
  }
  public getValue(indicator: IndicatorCacheType, key: string): any | undefined {
    if (!this.indicatorCache.has(indicator)) return;
    return this.indicatorCache.get(indicator)!.get(key);
  }
  public setKeyValue(
    indicator: IndicatorCacheType,
    key: string,
    value: any
  ): void {
    if (!this.indicatorCache.has(indicator))
      this.indicatorCache.set(indicator, new Collection());
    this.indicatorCache.get(indicator)!.set(key, value);
  }
  public removeKey(indicator: IndicatorCacheType, key: string): void {
    if (!this.indicatorCache.has(indicator)) return;
    this.indicatorCache.get(indicator)!.delete(key);
  }
}
