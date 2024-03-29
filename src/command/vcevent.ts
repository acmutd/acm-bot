import { EmbedBuilder } from "@discordjs/builders";
import { StageChannel, TextBasedChannel, VoiceChannel } from "discord.js";
import Command, { CommandContext } from "../api/command";
import { settings } from "../settings";

export default class VCEventCommand extends Command {
  constructor() {
    super({
      name: "vcevent",
      description: "Records user statistics for your current voice channel.",
      usage: [
        "vcevent <start|stop|stats|list>",
        "vcevent <start|stop|stats> [channel-id]",
      ],
      dmWorks: false,
      requiredRoles: [settings.points.staffRole],
    });
  }

  public async exec({ msg, bot, args }: CommandContext) {
    let vc: VoiceChannel | StageChannel;
    if (args.length < 1) return this.sendInvalidUsage(msg, bot);
    const action = args[0];
    if (args.length > 1) {
      const chan = /^\d{17,19}$/.test(args[1])
        ? await bot.channels.fetch(args[1])
        : undefined;
      if (
        !chan ||
        (!(chan instanceof VoiceChannel) && !(chan instanceof StageChannel))
      )
        return bot.response.emit(
          msg.channel,
          "Could not resolve that ID into a voice channel.",
          "invalid"
        );
      vc = chan;
    } else {
      if (!msg.member?.voice.channel && action !== "list") {
        return bot.response.emit(msg.channel, "Please join a voice channel.");
      }
      vc = msg.member?.voice.channel!;
    }
    let data;
    switch (action) {
      case "start":
      case "begin":
        if (bot.managers.activity.startVoiceEvent(vc))
          return bot.response.emit(
            msg.channel,
            `VC Event started for ${vc}.`,
            "success"
          );
        else
          return bot.response.emit(
            msg.channel,
            `VC Event already running ${vc}.`,
            "error"
          );
      case "stop":
      case "end":
        data = bot.managers.activity.stopVoiceEvent(vc);
        if (!data)
          return bot.response.emit(
            msg.channel,
            `No running VC Event in ${vc}.`,
            "error"
          );
        await this.printStats(msg.channel, vc, data);
        break;
      case "stats":
        data = bot.managers.activity.voiceEventStats(vc);
        if (!data)
          return bot.response.emit(
            msg.channel,
            `No running VC Event in ${vc}.`,
            "error"
          );
        await this.printStats(msg.channel, vc, data);
        break;
      case "list":
        const channels = Array.from(bot.managers.activity.voiceLog.keys()).map(
          (id) => `<#${id}>`
        );

        if (msg.channel.isVoiceBased()) return;
        await msg.channel.send({
          embeds: [
            new EmbedBuilder({
              title: "Current VC Events",
              description: channels.length > 0 ? channels.join("\n") : "none",
            }),
          ],
        });
        break;
      default:
        return this.sendInvalidUsage(msg, bot);
    }
  }

  async printStats(
    channel: TextBasedChannel,
    voiceChannel: VoiceChannel | StageChannel,
    stats: Map<string, number>
  ) {
    let sorted = Array.from(stats.keys()).sort(
      (a, b) => stats.get(b)! - stats.get(a)!
    );
    let descriptionArr: string[] = [];
    sorted.forEach((userID, i) => {
      const time = Math.round(stats.get(userID)! / 60000);
      descriptionArr.push(
        `\`${i + 1}\`. <@${userID}>: ${time} minute${time === 1 ? "" : "s"}`
      );
    });

    if (channel.isVoiceBased()) return;

    await channel.send({
      embeds: [
        new EmbedBuilder({
          title: `Time spent in #${voiceChannel.name}`,
          description: descriptionArr.join("\n"),
        }),
      ],
    });
  }
}
