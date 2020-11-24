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

export type TaskType = 'reminder' | 'newsletter' | 'rsvp_reminder' | 'caretaker';

export default class ScheduleManager {
    public tasks: Collection<string, Task>;
    public client: ACMClient;

    constructor(client: ACMClient) {
        this.tasks = new Collection<string, Task>();
        this.client = client;
    }

    public async setup() {
        // load in the tasks to schedule from DB and scheule them
        let res = await this.client.database.schemas.task.find({});
        res.forEach((el) => {
            let element = { ...el, id: el['_id'] };
            this.createTask(element);
        });
        return;
    }

    /**
     * Creates a task. If ID is passed, that ID will be used. Otherwise, a random ID will be generated.
     */
    public async createTask(task: Task): Promise<Task> {
        let t: Task = { ...task };
        if (t.id) {
            if (this.tasks.has(t.id)) {
                // throw 'ID already exists!';
                return this.tasks.get(t.id)!;
            }
            // at this point we know that if the user provided an ID, it is valid
        } else {
            // at this point we know the user hasnt provided an id
            // generate an id for our task
            t.id = uuidv4();
        }

        // finds out if the id is in db
        let search = await this.client.database.schemas.task.find({ _id: t.id });
        // if not
        if (search.length == 0) {
            // create the task
            await this.client.database.schemas.task.create({
                _id: t.id,
                cron: t.cron,
                type: t.type,
                payload: t.payload,
            });
        }

        const job = schedule.scheduleJob(t.cron, () => {
            this.runTask(t);
        });

        t.job = job;

        this.tasks.set(t.id!, t);

        return t;
    }

    /**
     * Cancels a task and deletes it from memory and database
     */
    public async deleteTask(id: string): Promise<boolean> {
        if (!this.hasTask(id)) return false;

        this.tasks.get(id)?.job?.cancel(); // cancel the job in the task
        this.tasks.delete(id); // remove the task itself
        await this.client.database.schemas.task.findByIdAndDelete(id); // remove from database

        return true;
    }

    public hasTask(id: string): Task | undefined {
        return this.tasks.get(id);
    }

    /**
     * Callback function that is scheduled and directs control back to the appropriate manager
     */
    private async runTask(task: Task) {
        // remove from list
        this.tasks.filter((t) => t.id != task.id);

        // remove from DB
        await this.client.database.schemas.task.remove({ _id: task.id });

        // end job
        if (task.job) {
            task.job.cancel();
        }

        switch (task.type) {
            case 'newsletter':
                // example: this.client.newsletter.sendLetter();
                this.client.services.newsletter.send();
                break;
            case 'reminder':
                // FOR TESTING
                this.client.guilds.cache
                    .first()
                    ?.members.cache.get(task.payload.id)
                    ?.send(task.payload.message);
                break;
            case 'rsvp_reminder':
                // example: this.client.rsvpmanager.sendRSVP(data.event_id);
                break;
            case 'caretaker':
                // example: this.client.caretaker.sendLove();
                break;
        }
    }
}

interface Task {
    id?: string;
    type: TaskType;
    cron: string | Date;
    payload?: any;
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
