import { FieldValue } from '@google-cloud/firestore';
import { Guild, GuildMember, User } from 'discord.js';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';
import { settings } from '../botsettings';

export default class TextEventCommand extends Command {
    constructor() {
        super({
            name: 'htfevent',
            description: 'enable/disable the entire hacktoberfest event',
            usage: ['.htfevent [start | stop]'],
            dmWorks: false,
            requiredRole: settings.hacktoberfest.staffRole,
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
                "Hacktoberfest and activity tracking has started!",
                "success"
            )
        }
        else if (args[0] == 'stop') {
            client.services.activity.disableTracking();
            return client.response.emit(
                msg.channel,
                "Hacktoberfest and activity tracking has stopped!",
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
