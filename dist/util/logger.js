"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const leeks_js_1 = __importDefault(require("leeks.js"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["INFO"] = 0] = "INFO";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["ERROR"] = 2] = "ERROR";
    LogLevel[LogLevel["REDIS"] = 3] = "REDIS";
    LogLevel[LogLevel["DATABASE"] = 4] = "DATABASE";
})(LogLevel || (LogLevel = {}));
var LogSeverity;
(function (LogSeverity) {
    LogSeverity[LogSeverity["NONE"] = 0] = "NONE";
    LogSeverity[LogSeverity["ERROR"] = 1] = "ERROR";
})(LogSeverity || (LogSeverity = {}));
class LoggerUtil {
    constructor() {
        this.logPath = `${process.cwd()}${path_1.sep}data`;
        this.colors = leeks_js_1.default.colors;
        this.init();
    }
    init() {
        if (!fs_1.existsSync(this.logPath))
            fs_1.mkdirSync(this.logPath);
        if (fs_1.existsSync(path_1.join(this.logPath, 'acmbot.log'))) {
            fs_1.unlinkSync(path_1.join(this.logPath, 'acmbot.log'));
            fs_1.writeFileSync(path_1.join(this.logPath, 'acmbot.log'), '');
        }
    }
    getDate() {
        const now = new Date();
        const seconds = `0${now.getSeconds()}`.slice(-2);
        const minutes = `0${now.getMinutes()}`.slice(-2);
        const hours = `0${now.getHours()}`.slice(-2);
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        return `[${hours}:${minutes}:${seconds} ${ampm}]`;
    }
    strip(message) {
        return message.replace(/\u001b\[.*?m/g, '');
    }
    write(level, severity, ...message) {
        let lvlText;
        switch (level) {
            default:
            case LogLevel.INFO:
                lvlText = this.colors.cyan(`[INFO/${process.pid}]`);
                break;
            case LogLevel.WARN:
                lvlText = this.colors.yellow(`[WARN/${process.pid}]`);
                break;
            case LogLevel.ERROR:
                lvlText = this.colors.red(`[ERROR/${process.pid}]`);
                break;
            case LogLevel.REDIS:
                lvlText = leeks_js_1.default.hex('#D82C20', `[REDIS/${process.pid}]`);
                break;
            case LogLevel.DATABASE:
                lvlText = leeks_js_1.default.rgb([88, 150, 54], `[MONGODB/${process.pid}]`);
                break;
        }
        const msg = message.map(m => m instanceof Array ? `[${m.join(', ')}]` : m instanceof Object ? util_1.inspect(m) : m).join('\n');
        fs_1.appendFileSync(`${this.logPath}${path_1.sep}acmbot.log`, `${this.getDate()} ${this.strip(lvlText)} -> ${this.strip(msg)}\n`);
        const output = severity === LogSeverity.ERROR ? process.stderr : process.stdout;
        output.write(`${this.colors.gray(this.getDate())} ${lvlText} -> ${msg}\n`);
    }
    info(...message) {
        this.write(LogLevel.INFO, LogSeverity.NONE, ...message);
    }
    warn(...message) {
        this.write(LogLevel.WARN, LogSeverity.NONE, ...message);
    }
    error(...message) {
        this.write(LogLevel.ERROR, LogSeverity.ERROR, ...message);
    }
    redis(...message) {
        this.write(LogLevel.ERROR, LogSeverity.ERROR, ...message);
    }
    database(...message) {
        this.write(LogLevel.DATABASE, LogSeverity.NONE, ...message);
    }
}
exports.default = LoggerUtil;
