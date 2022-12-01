import Command, { CommandContext } from "../api/command";
import { settings } from "../settings";
import { TextChannel } from "discord.js";
import { EmbedBuilder } from "@discordjs/builders";

export default class ShoutoutCommand extends Command {
  constructor() {
    super({
      name: "shoutout",
      description: "Give a shoutout to someone special.",
      usage: ["shoutout [list of mentions] [reason for shoutout]"],
    });
  }

  public async exec({ msg, bot, args }: CommandContext) {
    if (!/^<@!?[\d]{17,18}>/.test(args[0]))
      return bot.response.emit(msg.channel, "No user mentions.", "invalid");

    const receivers = [...msg.mentions.members!.values()];
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
    const embed = new EmbedBuilder({
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
    }).setColor(null);

    const channel = msg.guild?.channels.resolve(
      settings.channels.shoutout
    ) as TextChannel;
    await channel.send({ embeds: [embed] });
    await channel.send(
      msg.content.match(reg)![0].replace(settings.prefix + "shoutout", "")
    );

    return bot.response.emit(
      msg.channel,
      `Your shoutout has been sent to <#${channel}>!`
    );
  }
}
