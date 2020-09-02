import VerificationService from './services/VerificationService';
import DatabaseManager from './managers/DatabaseManager';
import IndicatorManager from './managers/IndicatorManager';
import CommandManager from './managers/CommandManager';
import EventManager from './managers/EventManager';
import * as Sentry from '@sentry/node';
import { Client } from 'discord.js';
import LoggerUtil from '../utils/Logger';
import CommandService from './services/CommandService';
import ResponseUtil, { ResponseFormat } from '../utils/Responses';
import { settings } from '../botsettings';
import ErrorManager from './managers/ErrorManager';
import RRService from './services/RRService';

export interface BotConfig {
    token: string;
    dbUrl: string;
    commandPath: string;
    eventPath: string;
    sentryDSN: string;
    responseFormat: ResponseFormat;
    disabledCommands: string[] | undefined;
    disabledCategories: string[] | undefined;
}

export default class ACMClient extends Client {
    // public commands: Collection<string, Command>;
    public settings: any;
    public logger: LoggerUtil;
    public response: ResponseUtil;
    public manager: CommandManager;
    public events: EventManager;
    public error: ErrorManager;
    public database: DatabaseManager;
    public indicators: IndicatorManager;
    public services: {
        verification: VerificationService;
        command: CommandService;
        rr: RRService;
    };
    public config: BotConfig;

    constructor(config: BotConfig) {
        super({ partials: ['REACTION', 'MESSAGE'] });
        this.settings = settings;
        this.logger = new LoggerUtil();
        this.response = new ResponseUtil(config.responseFormat);
        this.manager = new CommandManager(this, config.commandPath);
        this.events = new EventManager(this, config.eventPath);
        this.database = new DatabaseManager(this, config);
        this.error = new ErrorManager(this);
        this.indicators = new IndicatorManager();
        this.services = {
            verification: new VerificationService(this, settings.channels.verification),
            command: new CommandService(this),
            rr: new RRService(this),
        };
        this.config = config;
    }

    /**
     * Initializes and sets up the ACMClient instance
     */
    async start() {
        Sentry.init({ dsn: this.config.sentryDSN });
        await this.database.connect();
        await this.database.setup();
        this.manager.scanCommands();
        this.events.scanEvents();
        this.error.setup();
        // login
        this.login(this.config.token);

        await this.services.rr.fetchMsgs();
    }
}
