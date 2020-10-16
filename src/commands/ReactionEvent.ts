import { FieldValue } from '@google-cloud/firestore';
import { Guild, GuildMember, User } from 'discord.js';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';
import { settings } from '../botsettings';

export default class ReactionEventCommand extends Command {
    constructor() {
        super({
            name: 'reactionevent',
            description: 'start and stop and text events in the current channel',
            usage: ['.reactionevent [start | stop]',
                    '.reactionevent start [activity-id] [reaction] [points]',
                    '.reactionevent stop'],
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
            let reactionId: string;
            let points: number;
            let moderatorId = msg.author.id;
            let channelId = msg.channel.id;

            // check if there is already an event running in here
            if (client.indicators.hasKey('reactionEvent', channelId)) {
                return client.response.emit(
                    msg.channel,
                    `<@${client.indicators.getValue('reactionEvent', channelId).moderatorId}> is already running an event in this channel.`,
                    'invalid'
                );
            }

            // make sure we have all the args required
            if (args.length < 4) {
                return client.response.emit(
                    msg.channel,
                    `Usage: \`${this.usage[1]}\``,
                    'invalid'
                );
            }

            // make sure the emoji is an allowed guild emoji
            if (!/:(\d*)>/.test(args[2])) {
                return client.response.emit(
                    msg.channel,
                    'Please use a non-default discord emoji',
                    'invalid'
                );
            }

            // populate the args
            activityId = args[1];
            args[2].match(/:(\d*)>/)?.forEach((match => {
                reactionId = match;
            }));
            points = +args[3];

            // invalid award amount
            if (isNaN(points) || points < -100 || points > 100) {
                return client.response.emit(
                    msg.channel,
                    `\`${args[0]}\` is not a valid number of points between -100 and 100 (inclusive).`,
                    'invalid'
                );
            }

            // start reaction event and confirm
            client.services.hacktoberfest.startReactionEvent(channelId, activityId, reactionId!, moderatorId, points);
            return client.response.emit(
                msg.channel,
                "Reaction event has started!",
                "success"
            )
        }
        else if (args[0] == 'stop') {
            // purposely allows other mods to stop text channel events
            // attempt to disable the reaction event
            if (client.services.hacktoberfest.stopReactionEvent(msg.channel.id))
                return client.response.emit(
                    msg.channel,
                    "Reaction event has stopped!",
                    "success"
                );
            // if no reaction event exists, error
            else
                return client.response.emit(
                    msg.channel,
                    "There is no reaction event running in this channel.",
                    "invalid"
                );
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
