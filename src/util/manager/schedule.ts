import { Collection } from "discord.js";
import schedule, { Job } from "node-schedule";
import { v4 } from "uuid";
import Bot from "../../api/bot";
import Manager from "../../api/manager";
import { VCEvent } from "../../api/schema";

export type TaskType =
  | "reminder"
  | "circle_activity_reminder"
  | "circle_activity";

export interface Task {
  id?: string;
  type: TaskType;
  cron: string | Date;
  payload?: any;
  job?: Job; // Internal in-memory job linked to this task
}

export default class ScheduleManager extends Manager {
  public tasks: Collection<string, Task>;
  public vcEvents: Collection<string, VCEvent>;

  constructor(bot: Bot) {
    super(bot);
    this.tasks = new Collection();
    this.vcEvents = new Collection();
  }

  /**
   * Load scheduled tasks from database
   */
  public init(): void {
    const setup = async () => {
      const res = await this.bot.managers.firestore.fetchTasks();
      res.forEach(async (data) => {
        await this.createTask(data as Task);
      });
      const vcRes = await this.bot.managers.firestore.fetchVCTasks();
      vcRes.forEach(async (data) => {
        await this.createVCReminderTask(data);
      });
      return [res, vcRes];
    };
    setup().then(([res, vcRes]) => {
      this.bot.logger.info(
        `Loaded ${res.length} scheduled tasks and ${vcRes.length} VC events`
      );
    });
  }

  /**
   * Create a new task
   * @param task
   * @returns the created task, or existing task if ID already exists
   */
  public async createTask(task: Task): Promise<Task> {
    // create local task
    const t = { ...task };

    // If ID passed in and already exists, return existing task
    if (t.id && this.tasks.has(t.id)) return this.tasks.get(t.id)!;

    // If no ID passed in, generate one
    if (!t.id) t.id = v4();

    // Add task to the database
    const search = await this.bot.managers.firestore.findTask(t.id);
    console.log(search);
    if (!search) {
      const res = await this.bot.managers.firestore.createTask({
        _id: t.id,
        type: t.type,
        cron: t.cron,
        payload: t.payload,
      });
      console.log(res);
    }
    // Schedule task in memory
    t.job = schedule.scheduleJob(t.cron, () => this.runTask(t));
    this.tasks.set(t.id, t);

    return t;
  }

  public async createVCReminderTask(task: VCEvent): Promise<VCEvent> {
    // Check if task already exists
    if (this.vcEvents.has(task._id)) {
      this.vcEvents.set(task._id, task);
    }

    const search = await this.bot.managers.firestore.findVCEvent(task._id);
    if (!search) await this.bot.managers.firestore.createVCEvent(task);

    schedule.scheduleJob(task.startsIn, () => {
      this.runVCEvent(task);
    });
    this.vcEvents.set(task._id, task);
    return task;
  }
  /**
   *
   * @param id
   * @returns true on success, false on failure (task ID not found)
   */
  public async deleteTask(id: string): Promise<boolean> {
    const t = this.getTask(id);
    if (!t) return false;

    t.job?.cancel();
    this.tasks.delete(id);
    await this.bot.managers.firestore.deleteTask(id);

    return true;
  }

  /**
   *
   * @param id Task id
   * @returns Task if exists, else undefined
   */
  public getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  private async runTask(task: Task) {
    if (task.id) this.tasks.delete(task.id);
    await this.bot.managers.firestore.deleteTask(task.id!);
    if (task.job) task.job.cancel();

    switch (task.type) {
      case "reminder":
        this.bot.guilds.cache
          .first()
          ?.members.cache.get(task.payload.id)
          ?.send(task.payload.message);
        break;
      case "circle_activity_reminder":
        this.bot.managers.circle.sendActivityReminder(task.payload);
        break;
    }
    await this.deleteTask(task.id!);
  }

  private async runVCEvent(task: VCEvent) {
    this.bot.managers.circle.runVCEvent(task);
  }
}
