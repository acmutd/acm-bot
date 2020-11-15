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

        if (args.length < 2) {
            return client.response.emit(msg.channel, `Usage: \`${this.usage[0]}\``, 'invalid');
        }

        const cron = args[0];
        var d = 'old val';

        // const { id } = await client.scheduler.createTask({
        //     cron,
        //     task: () => console.log(`Task triggered, message is ${d}`),
        // });

        setTimeout(() => {
            d = 'new val';
        }, 10000);

        msg.reply(`Task created with id ${id}`);
    }
}
