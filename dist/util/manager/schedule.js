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
const node_schedule_1 = __importDefault(require("node-schedule"));
const uuid_1 = require("uuid");
const manager_1 = __importDefault(require("../../api/manager"));
class ScheduleManager extends manager_1.default {
    constructor(bot) {
        super(bot);
        this.tasks = new discord_js_1.Collection();
    }
    init() {
        const setup = () => __awaiter(this, void 0, void 0, function* () {
            const res = yield this.bot.managers.database.schemas.task.find({});
            res.forEach((data) => __awaiter(this, void 0, void 0, function* () {
                const taskData = data.toObject();
                const task = {
                    id: taskData['_id'],
                    type: taskData['type'],
                    cron: taskData['cron'],
                    payload: taskData['payload']
                };
                yield this.createTask(task);
            }));
            return res;
        });
        setup().then((res) => {
            this.bot.logger.info(`Loaded ${res.length} scheduled tasks...`);
        });
    }
    createTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            const t = Object.assign({}, task);
            if (t.id) {
                if (this.tasks.has(t.id))
                    return this.tasks.get(t.id);
            }
            else
                t.id = uuid_1.v4();
            const search = yield this.bot.managers.database.schemas.task.find({ _id: t.id });
            if (search.length == 0)
                yield this.bot.managers.database.schemas.task.create({
                    _id: t.id,
                    cron: t.cron,
                    type: t.type,
                    payload: t.payload
                });
            const job = node_schedule_1.default.scheduleJob(t.cron, () => this.runTask(t));
            t.job = job;
            this.tasks.set(t.id, t);
            return t;
        });
    }
    deleteTask(id) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasTask(id))
                return false;
            (_b = (_a = this.tasks.get(id)) === null || _a === void 0 ? void 0 : _a.job) === null || _b === void 0 ? void 0 : _b.cancel();
            this.tasks.delete(id);
            yield this.bot.managers.database.schemas.task.findByIdAndDelete(id);
            return true;
        });
    }
    hasTask(id) {
        return this.tasks.get(id);
    }
    runTask(task) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (task.id)
                this.tasks.delete(task.id);
            yield this.bot.managers.database.schemas.task.deleteOne({ _id: task.id });
            if (task.job)
                task.job.cancel();
            switch (task.type) {
                case 'newsletter':
                    //this.bot.managers.newsletter.send()
                    break;
                case 'reminder':
                    (_b = (_a = this.bot.guilds.cache.first()) === null || _a === void 0 ? void 0 : _a.members.cache.get(task.payload.id)) === null || _b === void 0 ? void 0 : _b.send(task.payload.message);
                    break;
                case 'rsvp_reminder':
                    break;
                case 'caretaker':
                    //this.bot.managers.caretaker.send()
                    break;
            }
            yield this.deleteTask(task.id);
        });
    }
}
exports.default = ScheduleManager;
