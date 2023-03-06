import {
  mkdirSync,
  existsSync,
  appendFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { sep, join } from "path";
import { inspect } from "util";
import leeks from "leeks.js";

type LogMessage = (string | object | any[])[];
enum LogLevel {
  INFO,
  WARN,
  ERROR,
  REDIS,
  DATABASE,
}
enum LogSeverity {
  NONE,
  ERROR,
}
export default class LoggerUtil {
  public logPath: string = `${process.cwd()}${sep}data`;
  public colors: typeof leeks.colors = leeks.colors;
  constructor() {
    this.init();
  }
  private init() {
    if (!existsSync(this.logPath)) mkdirSync(this.logPath);
    if (existsSync(join(this.logPath, "acmbot.log"))) {
      unlinkSync(join(this.logPath, "acmbot.log"));
      writeFileSync(join(this.logPath, "acmbot.log"), "");
    }
  }
  public getDate(): string {
    const now = new Date();
    const seconds = `0${now.getSeconds()}`.slice(-2);
    const minutes = `0${now.getMinutes()}`.slice(-2);
    const hours = `0${now.getHours()}`.slice(-2);
    const ampm = now.getHours() >= 12 ? "PM" : "AM";
    return `[${hours}:${minutes}:${seconds} ${ampm}]`;
  }
  private static strip(message: string) {
    return message.replace(/\u001b\[.*?m/g, "");
  }
  private write(
    level: LogLevel,
    severity: LogSeverity,
    ...message: LogMessage
  ): void {
    let lvlText!: string;
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
        lvlText = leeks.hex("#D82C20", `[REDIS/${process.pid}]`);
        break;
      case LogLevel.DATABASE:
        lvlText = leeks.rgb([88, 150, 54], `[FIREBASE/${process.pid}]`);
        break;
    }
    const msg = message
      .map((m) =>
        m instanceof Array
          ? `[${(m as any[]).join(", ")}]`
          : m instanceof Object
          ? inspect(m)
          : (m as string)
      )
      .join("\n");
    appendFileSync(
      `${this.logPath}${sep}acmbot.log`,
      `${this.getDate()} ${LoggerUtil.strip(lvlText)} -> ${LoggerUtil.strip(
        msg
      )}\n`
    );

    const output =
      severity === LogSeverity.ERROR ? process.stderr : process.stdout;
    output.write(`${this.colors.gray(this.getDate())} ${lvlText} -> ${msg}\n`);
  }
  public info(...message: LogMessage): void {
    this.write(LogLevel.INFO, LogSeverity.NONE, ...message);
  }
  public warn(...message: LogMessage): void {
    this.write(LogLevel.WARN, LogSeverity.NONE, ...message);
  }
  public error(...message: LogMessage): void {
    this.write(LogLevel.ERROR, LogSeverity.ERROR, ...message);
  }
  public redis(...message: LogMessage): void {
    this.write(LogLevel.ERROR, LogSeverity.ERROR, ...message);
  }
  public database(...message: LogMessage): void {
    this.write(LogLevel.DATABASE, LogSeverity.NONE, ...message);
  }
}
