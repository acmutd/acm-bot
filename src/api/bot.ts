import { Client, Intents } from 'discord.js'
import { settings } from '../settings'
import ResponseUtil, { ResponseFormat } from '../util/response'
import LoggerUtil from '../util/logger'
import CommandManager from '../util/manager/command'
import IndicatorManager from'../util/manager/indicator'
import EventManager from '../util/manager/event'
import DatabaseManager from '../util/manager/database'
import ScheduleManager from '../util/manager/schedule'

export interface Config {
    token: string
    dbUrl: string
    commandPath: string
    eventPath: string
    sentryDNS: string
    responseFormat: ResponseFormat
    disabledCommands: string[] | undefined
    disabledCategories: string[] | undefined
}
export interface ManagerList {
    command: CommandManager
    event: EventManager
    indicator: IndicatorManager
    database: DatabaseManager
    scheduler: ScheduleManager
}

export default class Bot extends Client {
    public settings: any
    public logger: LoggerUtil
    public response: ResponseUtil
    public managers: ManagerList
    public config: Config

    constructor(config: Config) {
        const intents = new Intents([Intents.NON_PRIVILEGED, 'GUILD_MEMBERS'])
        super({
            ws: { intents },
            partials: ['REACTION', 'MESSAGE', 'CHANNEL'],
            fetchAllMembers: true
        })
        this.settings = settings
        this.logger = new LoggerUtil()
        this.response = new ResponseUtil(config.responseFormat)
        this.managers = {
            command: new CommandManager(this, config.commandPath),
            event: new EventManager(this, config.eventPath),
            indicator: new IndicatorManager(this),
            database: new DatabaseManager(this, config),
            scheduler: new ScheduleManager(this)
        }
        this.config = config
    }
    async start(): Promise<void> {
        // start logic
        // Initialize Managers
        this.logger.info('Initializing managers...')
        Object.entries(this.managers).forEach(([k, v]) => {
            v.init()
        })
        await this.login(this.config.token)
        this.logger.info('Logged in...')
    }
}