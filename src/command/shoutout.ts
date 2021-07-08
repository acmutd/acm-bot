import Command from "../api/command";
import { CommandContext } from "../api/command";
import { settings } from "../settings";
import { MessageEmbed, TextChannel } from "discord.js";
import color from "../util/checker";

export default class ShoutoutCommand extends Command {
  constructor() {
    super({
      name: "shoutout",
      description: "Give a shoutout to someone special...",
      usage: ["shoutout [list of mentions] [reason for shoutout]"],
    });
  }
  public exec({ msg, bot, args }: CommandContext): void {
    if (!/^<@!?[\d]{17,18}>/.test(args[0]))
      return bot.response.emit(msg.channel, "No user mentions...", "invalid");

    const receivers = msg.mentions.members!.array();
    let title = `📣 ${
      msg.member?.nickname ?? msg.author.username
    } gave a shoutout to `;
    const last = receivers.pop();
    if (receivers.length > 0)
      title += `${receivers
        .map((m) => m.nickname ?? m.user.username)
        .join(", ")}${receivers.length > 0 ? ", and " : ""}${
        last?.nickname ?? last?.user.username
      }`;
    else title += `${last?.nickname ?? last?.user.username}`;

    const reg = /^.*?(<@!?[\d]{17,18}>|\s)+/;
    const text = msg.content.replace(reg, "");
    if (text.length < 1) return this.sendInvalidUsage(msg, bot);
    const embed = new MessageEmbed({
      title,
      fields: [
        {
          name: "Given to:",
          value: msg.content
            .match(reg)![0]
            .replace(settings.prefix + "shoutout", ""),
        },
        {
          name: "For:",
          value: text,
        },
      ],
      color: "RANDOM",
    });

    const channel = msg.guild?.channels.resolve(
      settings.channels.shoutout
    ) as TextChannel;
    channel.send(embed);
    channel.send(
      msg.content.match(reg)![0].replace(settings.prefix + "shoutout", "")
    );

    return bot.response.emit(
      msg.channel,
      `Your shoutout has been sent to <#${channel}>!`
    );
  }
}
