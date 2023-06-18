import { Client, IntentsBitField, Partials } from "discord.js";
import { settings, Settings, FirebaseSettings } from "../settings";
import ResponseUtil from "../util/response";
import LoggerUtil from "../util/logger";
import CommandManager from "../util/manager/command";
import IndicatorManager from "../util/manager/indicator";
import EventManager from "../util/manager/event";
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
import ReportManager from "../util/manager/report";
import CopeManager from "../util/manager/cope";

export interface Config {
  commandPath: string;
  slashCommandPath: string;
  cmCommandPath: string;
  buttonPath: string;
  eventPath: string;
  endpointPath: string;
  modalPath: string;
  firebaseSettings: FirebaseSettings;
}

export interface ManagerList {
  command: CommandManager;
  interaction: InteractionManager;
  error: ErrorManager;
  verification: VerificationManager;
  event: EventManager;
  indicator: IndicatorManager;
  scheduler: ScheduleManager;
  circle: CircleManager;
  rero: ReactionRoleManager;
  firestore: FirestoreManager;
  resolve: ResolveManager;
  express: ExpressManager;
  points: PointsManager;
  activity: ActivityManager;
  report: ReportManager;
  cope: CopeManager;
}

export default class Bot extends Client {
  public settings: Settings;
  public logger: LoggerUtil;
  public response: ResponseUtil;
  public readonly restConnection: REST;
  public managers: ManagerList;
  public config: Config;

  constructor(config: Config) {
    const intents = [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildIntegrations,
      IntentsBitField.Flags.GuildVoiceStates,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.GuildMessageReactions,
      IntentsBitField.Flags.DirectMessages,
      IntentsBitField.Flags.DirectMessageReactions,
      IntentsBitField.Flags.MessageContent,
    ];

    super({
      intents,
      partials: [Partials.Reaction, Partials.Message, Partials.Channel],
    });
    this.settings = { ...settings, ...config.firebaseSettings };
    this.logger = new LoggerUtil();
    this.response = new ResponseUtil(settings.responseFormat);
    this.restConnection = new REST({ version: "10" }).setToken(settings.token);
    this.managers = {
      firestore: new FirestoreManager(this),
      command: new CommandManager(this, config.commandPath),
      interaction: new InteractionManager(
        this,
        config.slashCommandPath,
        config.cmCommandPath,
        config.buttonPath,
        config.modalPath
      ),
      error: new ErrorManager(this),
      verification: new VerificationManager(this),
      event: new EventManager(this, config.eventPath),
      indicator: new IndicatorManager(this),
      scheduler: new ScheduleManager(this),
      circle: new CircleManager(this),
      rero: new ReactionRoleManager(this),
      resolve: new ResolveManager(this),
      express: new ExpressManager(this, config.endpointPath),
      points: new PointsManager(this),
      activity: new ActivityManager(this),
      report: new ReportManager(this),
      cope: new CopeManager(this),
    };
    this.config = config;
  }

  async start(): Promise<void> {
    await this.login(settings.token);
    this.logger.info("Initializing managers...");
    Object.entries(this.managers).forEach(([k, v]) => {
      v.init();
    });
    this.logger.info("Bot started.");
  }
}
