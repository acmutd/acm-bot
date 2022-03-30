import { Client, Intents } from "discord.js";
import { settings, Settings } from "../settings";
import ResponseUtil, { ResponseFormat } from "../util/response";
import LoggerUtil from "../util/logger";
import CommandManager from "../util/manager/command";
import IndicatorManager from "../util/manager/indicator";
import EventManager from "../util/manager/event";
import DatabaseManager from "../util/manager/database";
import ScheduleManager from "../util/manager/schedule";
import CircleManager from "../util/manager/circle";
import FirestoreManager from "../util/manager/firestore";
import ResolveManager from "../util/manager/resolve";
import ExpressManager from "../util/manager/express";
import PointsManager from "../util/manager/points";
import ActivityManager from "../util/manager/activity";
import VerificationManager from "../util/manager/verification";
import ErrorManager from "../util/manager/error";
import ReactionRoleManager from "../util/manager/rero";
import InteractionManager from "../util/manager/interaction";
import { REST } from "@discordjs/rest";

export interface Config {
  token: string;
  dbUrl: string;
  commandPath: string;
  eventPath: string;
  endpointPath: string;
  sentryDNS: string;
  responseFormat: ResponseFormat;
  disabledCommands: string[] | undefined;
  disabledCategories: string[] | undefined;
}

export interface ManagerList {
  command: CommandManager;
  interaction: InteractionManager;
  error: ErrorManager;
  verification: VerificationManager;
  event: EventManager;
  indicator: IndicatorManager;
  database: DatabaseManager;
  scheduler: ScheduleManager;
  circle: CircleManager;
  rero: ReactionRoleManager;
  firestore: FirestoreManager;
  resolve: ResolveManager;
  express: ExpressManager;
  points: PointsManager;
  activity: ActivityManager;
}

export default class Bot extends Client {
  public settings: Settings;
  public logger: LoggerUtil;
  public response: ResponseUtil;
  public readonly restConnection: REST;
  public managers: ManagerList;
  public config: Config;

  constructor(config: Config) {
    const intents = new Intents([
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_INTEGRATIONS,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ]);
    super({
      intents,
      partials: ["REACTION", "MESSAGE", "CHANNEL"],
    });
    this.settings = settings;
    this.logger = new LoggerUtil();
    this.response = new ResponseUtil(config.responseFormat);
    this.restConnection = new REST({ version: "9" }).setToken(config.token);
    this.managers = {
      command: new CommandManager(this, config.commandPath),
      interaction: new InteractionManager(this),
      error: new ErrorManager(this),
      verification: new VerificationManager(this),
      event: new EventManager(this, config.eventPath),
      indicator: new IndicatorManager(this),
      database: new DatabaseManager(this, config),
      scheduler: new ScheduleManager(this),
      circle: new CircleManager(this),
      rero: new ReactionRoleManager(this),
      firestore: new FirestoreManager(this),
      resolve: new ResolveManager(this),
      express: new ExpressManager(this, config.endpointPath),
      points: new PointsManager(this),
      activity: new ActivityManager(this),
    };
    this.config = config;
  }

  async start(): Promise<void> {
    await this.login(this.config.token);
    this.logger.info("Initializing managers...");
    Object.entries(this.managers).forEach(([k, v]) => {
      v.init();
    });
    this.logger.info("Bot started.");
  }
}
