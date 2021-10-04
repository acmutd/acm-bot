import { StageChannel, VoiceChannel } from "discord.js";
import Command, { CommandContext } from "../api/command";

export default class VCSnapshotCommand extends Command {
  constructor() {
    super({
      name: "vcsnapshot",
      description:
        "Take a snapshot of all users in your current voice channel...",
      longDescription:
        "Take a snapshot of all users in your current voice channel. You can also pass in a voice channel ID to take a snapshot of it without having to join...",
      usage: ["vcsnapshot", "vcsnapshot [channel-id]"],
      dmWorks: false,
    });
  }

  public async exec({ msg, bot, args }: CommandContext) {
    let voiceChannel: VoiceChannel | StageChannel | null | undefined;
    let attendees: Array<string> = [];

    if (args.length > 0) {
      const chan = /^\d{17,19}$/.test(args[0])
        ? await bot.channels.fetch(args[0])
        : undefined;
      if (
        !chan ||
        (!(chan instanceof VoiceChannel) && !(chan instanceof StageChannel))
      )
        return bot.response.emit(
          msg.channel,
          `Could not resolve the given ID into a valid voice channel...`,
          "invalid"
        );
      voiceChannel = chan;
    } else {
      voiceChannel = msg.member?.voice.channel;
      if (!voiceChannel)
        return bot.response.emit(
          msg.channel,
          `Please join a voice channel...`,
          "invalid"
        );
    }

    for (const [, member] of voiceChannel.members) {
      if (member.user.bot) continue;
      attendees.push(`<@${member.id}>`);
    }
    msg.channel
      .send({
        content:
          `**VC Snapshot for \`${voiceChannel.name}\` requested by ${msg.author}**\n` +
          `Members (${attendees.length}): ${attendees.join(" ")}\n` +
          `Copyable: \` ${attendees.join("` `")}\``,
        allowedMentions: { users: [] },
      })
      .catch(() =>
        msg.channel.send({
          content: `**VC Snapshot request failed for ${msg.author}**`,
          allowedMentions: { users: [] },
        })
      );
  }
}
