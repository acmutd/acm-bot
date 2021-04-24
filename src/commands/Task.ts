import { FieldValue } from '@google-cloud/firestore';
import { json } from 'body-parser';
import { Guild, GuildMember, User } from 'discord.js';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Task from '../structures/managers/ScheduleManager';
// Lists current automated runnables spawned by the ACM Bot instance.
export default class TaskCommand extends Command {
    constructor() {
        super({
            name: 'task',
            description: 'For now, this just lists the tasks',
            usage: ['task'],
            dmWorks: false,
        });
    }
    /**
     * Standard Command Executor
     * @param param0 Command Arguments
     * @returns Message Promise
     */
    public async exec({ msg, client, args }: CommandContext) {
        const tasks = client.scheduler.tasks;
        let embed = {
            title: `${tasks.size} task${tasks.size != 1 ? 's' : ''}`,
            fields: [] as any[],
            footer: {}
        };

        const options = {
            timeZone: 'America/Chicago', timeZoneName: 'short',
            year: 'numeric', month: 'numeric', day: 'numeric', 
            hour: 'numeric', minute: 'numeric', second: 'numeric' 
        };

        let expiredCnt = 0;
        for (const value of tasks.values()) {
            // NOTE THAT THIS RETURNS A CronDate. The typings are wrong.
            // See: https://github.com/node-schedule/node-schedule/issues/436
            const nextInvoke = value.job?.nextInvocation();

            if (nextInvoke) {
                const nextInvokeStr = (nextInvoke as any).toDate().toLocaleString("en-US", options);
                embed.fields.push({
                    name: value.id,
                    value: `Type: ${value.type}\nNext: ${nextInvokeStr}`
                });
            }
            else {
                expiredCnt++;
            }
        }

        if (expiredCnt > 0) {
            embed['footer'] = {
                text: `${expiredCnt} task${expiredCnt != 1 ? 's' : ''} omitted because already expired`
            }
        }

        return msg.channel.send({embed});
    }

}
