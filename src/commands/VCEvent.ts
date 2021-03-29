import { FieldValue } from '@google-cloud/firestore';
import { DMChannel, Guild, GuildMember, MessageEmbed, NewsChannel, TextChannel, User, VoiceChannel } from 'discord.js';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';
import { settings } from '../botsettings';
import {table} from 'table';

/*
VCEvent Structure

User interface: start and stop commands

Start calls start() on ActivityManager
Stop calls stop() on ~
- Compiles all leave and joins into total VC duration, returns info
- Returns statistics back to whoever called stop()
*/

export default class VCEvent extends Command {
    constructor() {
        super({
            name: "vcevent",
            description: "Records user statistics for your current voice channel",
            longDescription: "Records user statistics for your current voice channel.\n" +
                "You can also pass in a voice channel ID to use this command without having to join.",
            usage: [
                "vcevent <start|stop|stats|list>",
                "vcevent <start|stop|stats> [channel-id]"
            ],
            dmWorks: false,
            requiredRoles: [settings.roles.staff, settings.points.staffRole]
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        let voiceChannel: VoiceChannel | null | undefined;
        let attendees: Array<string> = [];

        // resolve action within suite
        if (args.length < 1) {
            return this.sendInvalidUsage(msg, client);
        }

        const action = args[0];

        // attempt to resolve the vc
        if (args.length > 1) {
            let chan = /^\d{17,19}$/.test(args[1]) ? await client.channels.fetch(args[1]) : undefined;
            if (!chan || chan.type != "voice") {
                return client.response.emit(
                    msg.channel,
                    `Could not resolve that ID into a valid voice channel`,
                    "invalid"
                );
            }
            voiceChannel = chan as VoiceChannel;
        }
        else {
            voiceChannel = msg.member?.voice.channel;
            if (!voiceChannel && action != 'list') {
                return client.response.emit(
                    msg.channel,
                    `Please join a voice channel!`,
                    "invalid"
                );
            }
        }

        switch(action) {
            case 'start':
            case 'begin':
            {
                if(client.activity.startVoiceEvent(voiceChannel!)) {
                    return client.response.emit(
                        msg.channel,
                        `VC Event started for ${voiceChannel}`,
                        'success'
                    )
                }
                else {
                    return client.response.emit(
                        msg.channel,
                        `A VC Event is already running in ${voiceChannel}`,
                        'error'
                    )
                }
            }

            case 'stop':
            case 'end': 
            {
                const data = client.activity.stopVoiceEvent(voiceChannel!);
                if (!data) {
                    return client.response.emit(
                        msg.channel,
                        `No VC Event is running in ${voiceChannel}`,
                        'error'
                    );
                } else {
                    this.printStats(msg.channel, voiceChannel!, data);
                }
                break;
            }

            case 'stats': 
            {
                const data = client.activity.voiceEventStats(voiceChannel!);
                if (!data) {
                    return client.response.emit(
                        msg.channel,
                        `No VC Event is running in ${voiceChannel}`,
                        'error'
                    );
                } else {
                    this.printStats(msg.channel, voiceChannel!, data);
                }
                break;
            }

            case 'list':
            {
                let channels = Array.from(client.activity.voiceLog.keys()).map(id => `<#${id}>`);
                await msg.channel.send(
                    new MessageEmbed({
                        title: 'VC Events currently running',
                        description: channels.length > 0 ? channels.join('\n') : 'none',
                    })
                );
                break;
            }

            default:
                return this.sendInvalidUsage(msg, client);
        }
        
    }

    async printStats(channel: TextChannel | DMChannel | NewsChannel, voiceChannel: VoiceChannel, stats: Map<string, number>) {
        let sorted = Array.from(stats.keys()).sort((a, b) => stats.get(b)! - stats.get(a)!);
        let descriptionArr: string[] = [];

        sorted.forEach((userID, i) => {
            const time = Math.round(stats.get(userID)! / 60000);
            descriptionArr.push(
                `\`${i + 1}\`. <@${userID}>: ${time} minute${time == 1 ? '' : 's'}`
            );
        })

      
        await channel.send(
            new MessageEmbed({
                title: `Time spent in ${voiceChannel}`,
                description: descriptionArr.join('\n'),
            })
        );
    }
}
