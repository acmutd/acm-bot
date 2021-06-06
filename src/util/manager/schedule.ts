import { Collection } from 'discord.js'
import schedule, { Job } from 'node-schedule'
import { v4 } from 'uuid'
import Bot from '../../api/bot'
import Manager from '../../api/manager'

export type TaskType = 'reminder' | 'newsletter' | 'rsvp_reminder' | 'caretaker'

export interface Task {
    id?: string
    type: TaskType
    cron: string | Date
    payload?: any
    job?: Job
}

export default class ScheduleManager extends Manager {
    public tasks: Collection<string, Task>

    constructor(bot: Bot) {
        super(bot)
        this.tasks = new Collection()
    }
    public init(): void {
        const setup = async () => {
            const res = await this.bot.managers.database.schemas.task.find({})
            res.forEach(async (data) => {
                const taskData = data.toObject()
                const task = {
                    id: taskData['_id'],
                    type: taskData['type'],
                    cron: taskData['cron'],
                    payload: taskData['payload']
                }
                await this.createTask(task)
            })
            return res
        }
        setup().then((res) => {
            this.bot.logger.info(`Loaded ${res.length} scheduled tasks...`)
        })
    }
    public async createTask(task: Task): Promise<Task> {
        const t = { ...task }
        if (t.id) {
            if (this.tasks.has(t.id)) return this.tasks.get(t.id)!
        } else t.id = v4()
        const search = await this.bot.managers.database.schemas.task.find({ _id: t.id })
        if (search.length == 0) await this.bot.managers.database.schemas.task.create({
            _id: t.id,
            cron: t.cron,
            type: t.type,
            payload: t.payload
        })
        const job = schedule.scheduleJob(t.cron, () => this.runTask(t))
        t.job = job
        this.tasks.set(t.id!, t)
        return t
    }
    public async deleteTask(id: string): Promise<boolean> {
        if (!this.hasTask(id)) return false
        this.tasks.get(id)?.job?.cancel()
        this.tasks.delete(id)
        await this.bot.managers.database.schemas.task.findByIdAndDelete(id)
        return true
    }
    public hasTask(id: string): Task | undefined {
        return this.tasks.get(id)
    }
    private async runTask(task: Task) {
        if (task.id) this.tasks.delete(task.id)
        await this.bot.managers.database.schemas.task.deleteOne({ _id: task.id })
        if (task.job) task.job.cancel()

        switch (task.type) {
            case 'newsletter':
                //this.bot.managers.newsletter.send()
                break
            case 'reminder':
                this.bot.guilds.cache.first()?.members.cache.get(task.payload.id)?.send(task.payload.message)
                break
            case 'rsvp_reminder':
                break
            case 'caretaker':
                //this.bot.managers.caretaker.send()
                break
        }
        await this.deleteTask(task.id!)
    }
}