import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';

export default class RemindCommand extends Command {
    constructor() {
        super({
            name: 'remind',
            description: 'Sets a reminder based on cron scheduling. Be sure to enclose in quotes.',
            usage: ['remind [cron] [message]'],
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        // args is alr parsed for us
        // we need to schedule a message to be sent using scheduler
        const cron = args[0];
        const { id } = await client.scheduler.addTask({
            cron,
            task: () => console.log('Task triggered'),
        });

        msg.reply(`Task created with id ${id}`);
    }
}
