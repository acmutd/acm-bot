import { Collection } from "discord.js";
import schedule, { Job } from "node-schedule";
import { v4 } from "uuid";
import Bot from "../../api/bot";
import Manager from "../../api/manager";

export type TaskType =
  | "reminder"
  | "circle_activity_reminder"

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
      const res = await this.bot.managers.database.schemas.task.find({});
      res.forEach(async (data) => {
        const taskData = data.toObject();
        const task = {
          id: taskData["_id"],
          type: taskData["type"],
          cron: taskData["cron"],
          payload: taskData["payload"],
        };
        await this.createTask(task);
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
    // create local cope
    const t = { ...task };

    // If ID passed in and already exists, return existing task
    if (t.id && this.tasks.has(t.id))
      return this.tasks.get(t.id)!;

    // If no ID passed in, generate one
    if (!t.id)
      t.id = v4();

    // Add task to the database
    const search = await this.bot.managers.database.schemas.task.find({
      _id: t.id,
    });
    if (search.length == 0)
      await this.bot.managers.database.schemas.task.create({
        _id: t.id,
        cron: t.cron,
        type: t.type,
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
    await this.bot.managers.database.schemas.task.findByIdAndDelete(id);

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
    await this.bot.managers.database.schemas.task.deleteOne({ _id: task.id });
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
}
