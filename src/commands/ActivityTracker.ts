import { FieldValue } from '@google-cloud/firestore';
import { Guild, GuildMember, User } from 'discord.js';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';

export default class ActivityTrackerCommand extends Command {
    constructor() {
        super({
            name: 'activitytracker',
            description: 'begin logging Hacktoberfest activity',
            usage: ['activitytracker [start | end]'],
            dmWorks: false,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        return msg.reply("This command is unavailable.");
        /*
        if (args.length != 1) {
            return client.response.emit(
                msg.channel,
                `Usage: \`${this.getUsageText(client.settings.prefix)}\``,
                'invalid'
            );
        }

        if (args[0] == 'start') {
            client.services.activity.enableTracking();
            return client.response.emit(msg.channel, 'Activity tracking has started!', 'success');
        } else if (args[0] == 'end') {
            client.services.activity.disableTracking();
            return client.response.emit(msg.channel, 'Activity tracking has ended!', 'success');
        } else {
            return client.response.emit(
                msg.channel,
                `Usage: \`${this.getUsageText(client.settings.prefix)}\``,
                'invalid'
            );
        }
        */
    }
}
