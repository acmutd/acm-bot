import { FieldValue } from '@google-cloud/firestore';
import { Guild, GuildMember, User, VoiceChannel } from 'discord.js';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';
import { settings } from '../botsettings';

export default class VoiceEventCommand extends Command {
    constructor() {
        super({
            name: 'voiceevent',
            description: 'start and stop voice channel events',
            usage: ['.voiceevent [start | stop]',
                    '.voiceevent start [activity-id] [points]',
                    '.voiceevent stop'],
            dmWorks: false,
            requiredRole: settings.hacktoberfest.staffRole,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        if (!client.services.activity.enabled) {
            return client.response.emit(
                msg.channel,
                'Hacktoberfest is not currently in session',
                'invalid'
            )
        }
        if (args.length < 1 || (args[0] != 'start' && args[0] != 'stop')) {
            return client.response.emit(
                msg.channel,
                `Usage: \`${this.usage[0]}\``,
                'invalid'
            );
        }

        // start event in the current channel
        if (args[0] == 'start') {
            let activityId: string;
            let points: number;
            let moderatorId = msg.author.id;
            let voiceChannel: VoiceChannel | null | undefined;

            // attempt to resolve the vc
            voiceChannel = msg.member?.voice.channel;
            if (!voiceChannel) {
                return client.response.emit(
                    msg.channel,
                    `Please join the voice channel you want the event to be started in! Be sure to run this command after the event really starts`,
                    'invalid'
                );
            }

            // check if there is already an event running in here
            if (client.indicators.hasKey('voiceEvent', voiceChannel.id)) {
                return client.response.emit(
                    msg.channel,
                    `<@${client.indicators.getValue('voiceEvent', voiceChannel.id).moderatorId}> is already running an event in this channel.`,
                    'invalid'
                );
            }

            // make sure we have all the args required
            if (args.length < 3) {
                return client.response.emit(
                    msg.channel,
                    `Usage: \`${this.usage[1]}\``,
                    'invalid'
                );
            }

            // populate the args
            activityId = args[1];
            points = +args[2];

            // start voice event and confirm
            client.services.hacktoberfest.startVoiceEvent(voiceChannel, activityId, moderatorId, points);
            return client.response.emit(
                msg.channel,
                "Voice event has started!",
                "success"
            )
        }
        else if (args[0] == 'stop') {
            let activityId: string;
            let points: number;
            let moderatorId: string;
            let voiceChannel: VoiceChannel | null | undefined;
            let attendees: Set<string> | undefined;

            // attempt to resolve the vc
            voiceChannel = msg.member?.voice.channel;
            if (!voiceChannel) {
                return client.response.emit(
                    msg.channel,
                    `Please join the voice channel you want the event to be stopped in! Be sure to run this command before the event really starts`,
                    'invalid'
                );
            }

            // make sure there is an event running
            if (!client.indicators.hasKey('voiceEvent', voiceChannel.id)) {
                return client.response.emit(
                    msg.channel,
                    "There is no voice event running in this channel.",
                    "invalid"
                );
            }
            
            
            // attempt to close off the event. If that is successful, award
            let voiceEvent = client.services.hacktoberfest.stopVoiceEvent(voiceChannel)
            if (voiceEvent) {
                let {success, failure} = await client.services.hacktoberfest.awardPoints(voiceEvent.points, voiceEvent.activityId, voiceEvent.attendees);
                return msg.reply(
                    `Voice event has stopped!\nAwarded **${voiceEvent.points}** points to **${success.length}** users for completing **${voiceEvent.activityId}**:\n${success.join(' ')}\n` +
                    (failure.length ? `${failure.length} users were not registered: ${failure.join(' ')}` : ''), 
                    {"allowedMentions": { "users" : []}},
                )
            }
            // if no voice event exists, error
            else
                return client.response.emit(
                    msg.channel,
                    "There is no event running in this voice channel.",
                    "invalid"
                )
        }
        else {
            return client.response.emit(
                msg.channel,
                `Usage: \`${this.usage[0]}\``,
                'invalid'
            );
        }
    }
}
