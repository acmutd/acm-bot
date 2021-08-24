"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const settings_1 = require("../settings");
const response_1 = __importDefault(require("../util/response"));
const logger_1 = __importDefault(require("../util/logger"));
const command_1 = __importDefault(require("../util/manager/command"));
const indicator_1 = __importDefault(require("../util/manager/indicator"));
const event_1 = __importDefault(require("../util/manager/event"));
const database_1 = __importDefault(require("../util/manager/database"));
const schedule_1 = __importDefault(require("../util/manager/schedule"));
const circle_1 = __importDefault(require("../util/manager/circle"));
const firestore_1 = __importDefault(require("../util/manager/firestore"));
const resolve_1 = __importDefault(require("../util/manager/resolve"));
const points_1 = __importDefault(require("../util/manager/points"));
const activity_1 = __importDefault(require("../util/manager/activity"));
class Bot extends discord_js_1.Client {
    constructor(config) {
        const intents = new discord_js_1.Intents([discord_js_1.Intents.NON_PRIVILEGED, "GUILD_MEMBERS"]);
        super({
            ws: { intents },
            partials: ["REACTION", "MESSAGE", "CHANNEL"],
            fetchAllMembers: true,
        });
        this.settings = settings_1.settings;
        this.logger = new logger_1.default();
        this.response = new response_1.default(config.responseFormat);
        this.managers = {
            command: new command_1.default(this, config.commandPath),
            event: new event_1.default(this, config.eventPath),
            indicator: new indicator_1.default(this),
            database: new database_1.default(this, config),
            scheduler: new schedule_1.default(this),
            circle: new circle_1.default(this),
            firestore: new firestore_1.default(this),
            resolve: new resolve_1.default(this),
            points: new points_1.default(this),
            activity: new activity_1.default(this),
        };
        this.config = config;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("Initializing managers...");
            Object.entries(this.managers).forEach(([k, v]) => {
                v.init();
            });
            yield this.login(this.config.token);
            this.logger.info("Logged in...");
        });
    }
}
exports.default = Bot;
