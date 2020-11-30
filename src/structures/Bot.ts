import VerificationService from './services/VerificationService';
import DatabaseManager from './managers/DatabaseManager';
import IndicatorManager from './managers/IndicatorManager';
import CommandManager from './managers/CommandManager';
import EventManager from './managers/EventManager';
import ExpressManager from './managers/ExpressManager';
import CalendarManager from './managers/CalendarManager';
import ScheduleManager from './managers/ScheduleManager';
import * as Sentry from '@sentry/node';
import { Client, Intents } from 'discord.js';
import LoggerUtil from '../utils/Logger';
import CommandService from './services/CommandService';
import ResponseUtil, { ResponseFormat } from '../utils/Responses';
import { settings } from '../botsettings';
import ErrorManager from './managers/ErrorManager';
import RRService from './services/RRService';
import FirestoreManager from './managers/FirestoreManager';
import HacktoberfestService from './services/HacktoberfestService';
import ResolveService from './services/ResolveService';
import ActivityService from './services/ActivityService';
import NewsletterService from './services/NewsletterService';
import CaretakerService from './services/CaretakerService';

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
    // managers
    public manager: CommandManager;
    public events: EventManager;
    public error: ErrorManager;
    public database: DatabaseManager;
    public firestore: FirestoreManager;
    public calendar: CalendarManager;
    public express: ExpressManager;
    public indicators: IndicatorManager;
    public scheduler: ScheduleManager;
    // public express: ExpressManager;
    // public calendar: CalendarManager;
    // services
    public services: {
        verification: VerificationService;
        newsletter: NewsletterService;
        caretaker: CaretakerService;
        command: CommandService;
        rr: RRService;
        hacktoberfest: HacktoberfestService;
        activity: ActivityService;
        resolver: ResolveService;
    };
    public config: BotConfig;

    constructor(config: BotConfig) {
        const intents = new Intents([Intents.NON_PRIVILEGED, 'GUILD_MEMBERS']);
        super({
            ws: { intents },
            partials: ['REACTION', 'MESSAGE'],
            fetchAllMembers: true,
        });
        this.settings = settings;
        this.logger = new LoggerUtil();
        this.response = new ResponseUtil(config.responseFormat);
        this.manager = new CommandManager(this, config.commandPath);
        this.events = new EventManager(this, config.eventPath);
        this.database = new DatabaseManager(this, config);
        this.firestore = new FirestoreManager(this);
        this.calendar = new CalendarManager(this);
        this.express = new ExpressManager(this);
        this.error = new ErrorManager(this);
        this.scheduler = new ScheduleManager(this);
        this.indicators = new IndicatorManager();
        this.services = {
            verification: new VerificationService(this, settings.channels.verification),
            newsletter: new NewsletterService(this),
            caretaker: new CaretakerService(this),
            command: new CommandService(this),
            rr: new RRService(this),
            hacktoberfest: new HacktoberfestService(this),
            activity: new ActivityService(this),
            resolver: new ResolveService(this),
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
        this.firestore.setup();
        this.manager.scanCommands();
        this.events.scanEvents();
        this.error.setup();

        await this.login(this.config.token);

        this.services.rr.fetchMsgs();

        this.calendar.setup();
        this.express.setup();
        this.scheduler.setup();

        // this.on('debug', (e) => {
        //     console.error(e);
        // });

        // await this.services.rr.fetchMsgs();
    }
}
