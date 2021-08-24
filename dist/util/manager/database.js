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
const manager_1 = __importDefault(require("../../api/manager"));
const discord_js_1 = require("discord.js");
const mongoose_1 = __importDefault(require("mongoose"));
const schema_1 = require("../../api/schema");
class DatabaseManager extends manager_1.default {
    constructor(bot, config) {
        super(bot);
        this.cache = {
            responses: new discord_js_1.Collection(),
            rrmessages: new discord_js_1.Collection(),
            circles: new discord_js_1.Collection(),
        };
        this.url = config.dbUrl;
        this.schemas = {
            member: schema_1.MemberSchema,
            response: schema_1.ResponseSchema,
            rrmessage: schema_1.RRMessageSchema,
            task: schema_1.TaskSchema,
            circle: schema_1.CircleSchema,
        };
    }
    init() {
        const setup = () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.connect();
                yield this.recache("response");
                yield this.recache("rrmessage");
                yield this.recache("circle");
            }
            catch (e) {
                this.bot.logger.error(e);
            }
        });
        setup().then(() => {
            this.bot.logger.info("Cached cirlce, response, and reaction role data...");
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.m = yield mongoose_1.default.connect(this.url, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false,
            });
            this.m.connection.on("error", (err) => {
                this.bot.logger.error("Databse connection error...");
                this.bot.logger.error(err);
            });
        });
    }
    dispose() {
        this.m.connection.close();
        this.bot.logger.database("Closed database connection...");
    }
    recache(schema, cache) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const docs = yield this.schemas[schema].find({});
                this.cache[cache !== null && cache !== void 0 ? cache : `${schema}s`] = new discord_js_1.Collection();
                docs.forEach((doc) => {
                    this.cache[cache !== null && cache !== void 0 ? cache : `${schema}s`].set(doc["_id"], doc);
                });
            }
            catch (e) {
                this.bot.logger.error(e);
            }
        });
    }
    responseAdd(type, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.schemas.response.create({ type, message });
                yield this.recache("response");
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    responseDelete(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.schemas.response.findOneAndDelete({ message });
                yield this.recache("response");
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    rrmsgAdd(newData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.schemas.rrmessage.create(newData);
            yield this.recache("rrmessage");
        });
    }
    rrmsgDelete(id) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    circleAdd(circleData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.schemas.circle.create(circleData);
                yield this.recache("circle");
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    circleRemove(circleId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.schemas.circle.findByIdAndDelete(circleId);
                yield this.recache("circle");
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    circleUpdate(circleId, newData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.schemas.circle.findByIdAndUpdate(circleId, newData);
                yield this.recache("circle");
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
}
exports.default = DatabaseManager;
