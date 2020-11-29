import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import schedule, { Job } from 'node-schedule';

export default class RemindCommand extends Command {
    constructor() {
        super({
            name: 'remind',
            description: 'Sets a reminder a certain number of minutes ahead.',
            usage: ['remind [minutes] [message]'],
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        if (args.length < 2) {
            return client.response.emit(msg.channel, `Usage: \`${this.usage[0]}\``, 'invalid');
        }

        const minutes = parseInt(args[0]);
        const message = args[1];

        if (isNaN(minutes) || minutes < 1 || minutes > 6*7*24*60) {
            return client.response.emit(
                msg.channel,
                `Please set a time between ${1} and ${6*7*24*60} minutes away.`,
                'invalid'
            );
        }

        // calculate date with the minute offset
        const date = new Date(Date.now() + minutes*60000);

        // options for formatting date printing
        const options = {
            timeZone: 'America/Chicago', timeZoneName: 'short',
            year: 'numeric', month: 'numeric', day: 'numeric', 
            hour: 'numeric', minute: 'numeric', second: 'numeric' 
        };

        const dateStr = date.toLocaleString("en-US", options);

        await client.scheduler.createTask({
            cron: date,
            type: 'reminder',
            payload: {
                message,
                id: msg.author.id,
            },
        });

        return client.response.emit(
            msg.channel,
            `${msg.author}, I'll DM you with your reminder at \`${dateStr}\`!`,
            'success'
        );
    }
}
