import Command, { CommandContext } from '../api/command'
import { VoiceChannel } from 'discord.js'

export default class VCPingCommand extends Command {
  constructor() {
    super({
      name: "vcping",
      description: "Ping everyone in a voice channel...",
      usage: ["vcping", "vcping [channel-id]"],
      dmWorks: false
    })
  }
  public async exec({ msg, bot, args }: CommandContext) {
    let voiceChannel: VoiceChannel | null | undefined
    let attendees: Array<string> = []

    if (args.length > 0) {
      const channel = /^\d{17,19}$/.test(args[0])
        ? await bot.channels.fetch(args[0])
        : undefined;
      if (!channel || channel.type !== 'voice') return bot.response.emit(msg.channel, 'Could not resolve the given ID into a valid voice channel...', 'invalid')
      voiceChannel = channel as VoiceChannel
    } else {
      voiceChannel = msg.member?.voice.channel
      if (!voiceChannel) return bot.response.emit(msg.channel, 'Please join a voice channel...', 'invalid')
    }
    const mentions = []
    for (const [, member] of voiceChannel.members) {
      if (member.user.bot) continue;
      attendees.push(`<@${member.id}>`)
      mentions.push(member.id)
    }
    msg.channel.send(`VC Ping for \`${voiceChannel.name}\` requested by ${msg.author}**\n` + `Members (${attendees.length}): ${attendees.join(" ")}\n` + `Copyable: \` ${attendees.join("` `")}\``, { allowedMentions: { users: mentions }}).catch(() => msg.channel.send(`VC Ping request failed for ${msg.author}**`, { allowedMentions: { users: [] }}))
  }
}