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
import PointsSystemService from './services/PointsSystemService';
import ResolveService from './services/ResolveService';
import ActivityManager from './managers/ActivityManager';
import NewsletterService from './services/NewsletterService';
import CaretakerService from './services/CaretakerService';
import CircleService from './services/CircleService';

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
    public activity: ActivityManager;
    // public express: ExpressManager;
    // public calendar: CalendarManager;
    // services
    public services: {
        verification: VerificationService;
        newsletter: NewsletterService;
        caretaker: CaretakerService;
        command: CommandService;
        rr: RRService;
        points: PointsSystemService;
        resolver: ResolveService;
        circles: CircleService;
    };
    public config: BotConfig;

    constructor(config: BotConfig) {
        const intents = new Intents([Intents.NON_PRIVILEGED, 'GUILD_MEMBERS']);
        super({
            ws: { intents },
            partials: ['REACTION', 'MESSAGE', 'CHANNEL'],
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
        this.activity = new ActivityManager(this);
        this.services = {
            verification: new VerificationService(this, settings.channels.verification),
            newsletter: new NewsletterService(this),
            caretaker: new CaretakerService(this),
            command: new CommandService(this),
            rr: new RRService(this),
            points: new PointsSystemService(this),
            resolver: new ResolveService(this),
            circles: new CircleService(this),
        };
        this.config = config;
    }

    /**
     * Initializes and sets up the ACMClient instance
     */
    async start() {
        // ! enable when done w testing
        // Sentry.init({ dsn: this.config.sentryDSN });
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

        // await this.services.circles.repost();

        // await this.services.rr.fetchMsgs();
    }
}
