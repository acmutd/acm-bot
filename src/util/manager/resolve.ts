import {
  Message,
  DMChannel,
  MessageEmbed,
  GuildMember,
  Guild,
  User,
} from "discord.js";
import Bot from "../../api/bot";
import Command from "../../api/command";
import { settings } from "../../settings";
import { FieldValue } from "@google-cloud/firestore";
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
    if (
      !member &&
      (strategies.size === 0 || strategies.has("id")) &&
      /^[\d]{17,18}$/.test(toResolve)
    )
      member = guild?.members.cache.find((gm) => gm.user.id === toResolve);
    if (
      !member &&
      (strategies.size === 0 || strategies.has("mention")) &&
      /^<@!?[\d]{17,18}>$/.test(toResolve)
    )
      member = guild?.members.cache.find(
        (gm) => gm.user.id === toResolve.slice(3, -1)
      );
    if (
      !member &&
      (strategies.size === 0 || strategies.has("tag")) &&
      /#\d{4}$/.test(toResolve)
    )
      member = guild?.members.cache.find((gm) => gm.user.tag === toResolve);
    if (!member && (strategies.size === 0 || strategies.has("username")))
      member = guild?.members.cache.find(
        (gm) => gm.user.username === toResolve
      );
    if (!member && (strategies.size === 0 || strategies.has("nickname")))
      member = guild?.members.cache.find((gm) => gm.nickname === toResolve);
    if (lenient) {
      toResolve = this.makeLenient(toResolve);
      if (
        !member &&
        (strategies.size === 0 || strategies.has("tag")) &&
        /#\d{4}$/.test(toResolve)
      )
        member = guild?.members.cache.find(
          (gm) => this.makeLenient(gm.user.tag) === toResolve
        );
      if (!member && (strategies.size === 0 || strategies.has("username")))
        member = guild?.members.cache.find(
          (gm) => this.makeLenient(gm.user.username) === toResolve
        );
      if (!member && (strategies.size === 0 || strategies.has("nickname")))
        member = guild?.members.cache.find(
          (gm) => this.makeLenient(gm.nickname ? gm.nickname : "") === toResolve
        );
    }
    return member;
  }
  private makeLenient(str: string) {
    return str.replace(" ", "").toLowerCase();
  }
}
