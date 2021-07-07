"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = __importDefault(require("./api/bot"));
const path = __importStar(require("path"));
const settings_1 = require("./settings");
const bot = new bot_1.default({
    token: settings_1.settings.token,
    dbUrl: settings_1.settings.databaseURL,
    sentryDNS: settings_1.settings.sentryDNS,
    commandPath: path.join(process.cwd(), 'dist', 'command'),
    eventPath: path.join(process.cwd(), 'dist', 'event'),
    responseFormat: settings_1.settings.responseFormat,
    disabledCommands: settings_1.settings.disabledCommands,
    disabledCategories: settings_1.settings.disabledCategories
});
bot.start();
