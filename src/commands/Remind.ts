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
        if (args.length < 1) {
            return client.response.emit(msg.channel, `Usage: \`${this.usage[0]}\``, 'invalid');
        }

        const minutes = parseInt(args[0]) ?? 2;
        const now = new Date();
        const cron = `${now.getMinutes() + (minutes % 60)} ${now.getHours() + (6 % 24)} * * *`;
        const date = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes() + minutes
        );

        await client.scheduler.createTask({
            cron: date,
            type: 'reminder',
            payload: {
                message: args[1],
                id: msg.author.id,
            },
        });

        msg.reply(
            `Set the reminder for \`${minutes}\` minutes from now!\nCron generated: \`${cron}\``
        );
    }
}
