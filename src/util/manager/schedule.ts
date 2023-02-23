import { VCTask } from "./../../interaction/command/bookvc";
import { Collection } from "discord.js";
import schedule, { Job } from "node-schedule";
import { v4 } from "uuid";
import Bot from "../../api/bot";
import Manager from "../../api/manager";

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

  constructor(bot: Bot) {
    super(bot);
    this.tasks = new Collection();
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
      return res;
    };
    setup().then((res) => {
      this.bot.logger.info(`Loaded ${res.length} scheduled tasks.`);
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
    if (!search)
      await this.bot.managers.firestore.createTask({
        _id: t.id,
        type: t.type,
        cron: t.cron,
        payload: t.payload,
      });

    // Schedule task in memory
    t.job = schedule.scheduleJob(t.cron, () => this.runTask(t));
    this.tasks.set(t.id, t);

    return t;
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

  private async runTask(task: Task | VCTask) {
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
      case "circle_activity":
        this.bot.managers.circle.sendActivity(
          task as VCTask,
          task.payload.type
        );
        break;
    }
    await this.deleteTask(task.id!);
  }
}
