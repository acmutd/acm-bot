import { Guild, GuildMember } from "discord.js";
import Bot from "../../api/bot";
import Manager from "../../api/manager";

export default class ResolveManager extends Manager {
  constructor(bot: Bot) {
    super(bot);
  }

  init() {}

  async resolveGuildMember(
    toResolve: string,
    guild: Guild,
    strategies: Set<string> = new Set<string>(),
    lenient: boolean = true
  ): Promise<GuildMember | undefined> {
    let member: GuildMember | undefined;

    // Ensure all members are in cache
    await guild.members.fetch();

    // First perform strict searching]

    // Resolve on ID
    if (
      !member &&
      (strategies.size === 0 || strategies.has("id")) &&
      /^[\d]{17,18}$/.test(toResolve)
    )
      member = await guild.members.fetch(toResolve);

    // Resolve on mention
    if (
      !member &&
      (strategies.size === 0 || strategies.has("mention")) &&
      /^<@!?[\d]{17,18}>$/.test(toResolve)
    )
      member = await guild.members.fetch(toResolve.slice(3, -1));

    if (
      !member &&
      (strategies.size === 0 ||
        strategies.has("tag") ||
        strategies.has("username") ||
        strategies.has("nickname"))
    ) {
      const memberSearch = await guild.members.search({ query: toResolve });
      member = memberSearch.at(0);
    }

    if (lenient) {
      toResolve = ResolveManager.makeLenient(toResolve);
      if (
        !member &&
        (strategies.size === 0 || strategies.has("tag")) &&
        /#\d{4}$/.test(toResolve)
      )
        member = guild.members.cache.find(
          (gm) => ResolveManager.makeLenient(gm.user.tag) === toResolve
        );

      if (!member && (strategies.size === 0 || strategies.has("username")))
        member = guild.members.cache.find(
          (gm) => ResolveManager.makeLenient(gm.user.username) === toResolve
        );

      if (!member && (strategies.size === 0 || strategies.has("nickname")))
        member = guild.members.cache.find(
          (gm) =>
            ResolveManager.makeLenient(gm.nickname ? gm.nickname : "") ===
            toResolve
        );
    }
    return member;
  }

  private static makeLenient(str: string) {
    return str.replace(" ", "").toLowerCase();
  }
}
