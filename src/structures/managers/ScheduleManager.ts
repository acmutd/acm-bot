import { Collection } from 'discord.js';
import schedule, { Job } from 'node-schedule';
import { v4 as uuidv4 } from 'uuid';
import ACMClient from '../Bot';

/*
    *    *    *    *    *    *
    ┬    ┬    ┬    ┬    ┬    ┬
    │    │    │    │    │    │
    │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
    │    │    │    │    └───── month (1 - 12)
    │    │    │    └────────── day of month (1 - 31)
    │    │    └─────────────── hour (0 - 23)
    │    └──────────────────── minute (0 - 59)
    └───────────────────────── second (0 - 59, OPTIONAL)
 */

export default class ScheduleManager {
    public tasks: Collection<string, Task>;
    public client: ACMClient;

    constructor(client: ACMClient) {
        this.tasks = new Collection<string, Task>();
        this.client = client;
        // grab stuff from mongodb
    }

    public setup() {
        // load in the tasks to schedule from DB and scheule them
        return;
        throw 'incomplete function';
    }

    public async addTask(task: Task): Promise<Task> {
        let t: Task = { ...task };
        if (t.id) {
            if (this.tasks.has(t.id)) {
                throw 'ID already exists!';
            }
            // at this point we know that if the user provided an ID, it is valid
        } else {
            // at this point we know the user hasnt provided an id
            // generate an id for our task
            t.id = uuidv4();
        }

        this.tasks.set(t.id!, t);

        const job = schedule.scheduleJob(t.cron, () => {
            t.task();
        });

        //await this.client.database.schemas.task.create({
        //    _id: t.id,
        //    cron: t.cron,
        //    task: t.task,
        //});

        t.job = job;

        return t;
    }

    public removeTask(id: string): boolean {
        return this.tasks.delete(id);
    }

    public searchTask(id: string): Task | undefined {
        return this.tasks.get(id);
    }
}

interface Task {
    task(): void;
    cron: string;
    id?: string;
    job?: Job;
}

/**
 * What functionality do we need
 * add task
 * remove task
 * add user to task: handled by
 *
 */

/**
 * What needs to persist
 *   - Scheduled tasks metadata (id, function, cron, etc.)
 *     - Used to reschedule at startup
 *   - Mappings from task to set of users (not in here)
 *   - Mappings from task to ID in order to cancel
 */
