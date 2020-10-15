import { FieldValue } from '@google-cloud/firestore';
import { Guild, GuildMember, User } from 'discord.js';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';

export default class EventCommand extends Command {
    constructor() {
        super({
            name: 'event',
            description: 'start and stop voice channel and text events',
            usage: ['.event start text [text-channel] [activity-id] [reaction]',
                    '.event stop text [text-channel] [activity-id] [reaction]',
                    '.event [start | end] voice [activity-id] [points]'],
            dmWorks: false,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        if (args.length != 1) {
            return client.response.emit(
                msg.channel,
                `Usage: \`${this.usage[0]}\``,
                'invalid'
            );        
        }

        if (args[0] == 'start') {
            client.services.activity.enableTracking();
            return client.response.emit(
                msg.channel,
                "Activity tracking has started!",
                "success"
            )
        }
        else if (args[0] == 'end') {
            client.services.activity.disableTracking();
            return client.response.emit(
                msg.channel,
                "Activity tracking has ended!",
                "success"
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
