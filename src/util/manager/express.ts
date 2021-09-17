import fs from "fs";
import bodyParser from "body-parser";
import express, { Express, Request, Response } from "express";
import http from "http";
import Bot from "../../api/bot";
import { settings } from "../../settings";
import Manager from "../../api/manager";

export default class ExpressManager extends Manager {
  public app: Express;
  public port: number;

  public endpointPath: string;
  public server: http.Server | null = null;

  constructor(bot: Bot) {
    super(bot);
    this.app = express();

    this.port = settings.express.port;
    this.endpointPath = __dirname + "/../../endpoint/";
  }

  /**
   * Setup express application and dynamically load endpoints
   */
  async init() {
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.raw());

    this.setupEndpoints();

    this.app.listen(this.port, () => {
      this.bot.logger.info(`Express server started on port ${this.port}!`);
    });
  }

  setupEndpoints() {
    if (!fs.existsSync(this.endpointPath)) {
      this.bot.logger.error(
        `No express endpoints found at ${this.endpointPath}!`
      );
      return;
    }
    const endpointFiles: string[] = fs.readdirSync(this.endpointPath);
    endpointFiles.forEach((file) => {
      // Skip non-js files, such as map files.
      if (!file.endsWith(".js")) return;

      require(this.endpointPath + file)(this.app, this.bot);
    });

    // Log endpoint names
    this.app._router.stack.forEach((r: any) => {
      if (r.route && r.route.path) {
        this.bot.logger.info(`Registered the '${r.route.path}' endpoint!`);
      }
    });
  }
}
