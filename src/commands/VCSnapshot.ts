import { FieldValue } from '@google-cloud/firestore';
import { Guild, GuildMember, User, VoiceChannel } from 'discord.js';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';
import { settings } from '../botsettings';

export default class VCSnapshot extends Command {
    constructor() {
        super({
            name: 'vcsnapshot',
            description: 'take a snapshot of all users in your current voice chanel',
            usage: [
                'vcsnapshot',
            ],
            dmWorks: false,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        let voiceChannel: VoiceChannel | null | undefined;
        let attendees: Array<string> = [];

        // attempt to resolve the vc
        voiceChannel = msg.member?.voice.channel;
        if (!voiceChannel) {
            return client.response.emit(
                msg.channel,
                `Please join a voice channel!`,
                'invalid'
            );
        }

        for (const [, member] of voiceChannel.members) {
            if (member.user.bot) continue;
            attendees.push(`<@${member.id}>`);
        }

        msg.channel.send(
            `**VC Snapshot for \`${voiceChannel.name}\` requested by ${msg.author}**:\n` + 
            `Member list: ${attendees.join(" ")}\n` + 
            `Copyable list: \`${attendees.join("` `")}\``,
            {allowedMentions: {users: []}}
        );
    }
}
