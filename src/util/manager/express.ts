import fs from "fs";
import bodyParser from "body-parser";
import express, { Express, Request, Response } from "express";
import http from "http";
import Bot from "../../api/bot";
import { settings } from "../../settings";
import Manager from "../../api/manager";
import DynamicLoader from "../dynamicloader";

export default class ExpressManager extends Manager {
  public app: Express;
  public port: number;

  public endpointPath: string;
  public server: http.Server | null = null;

  constructor(bot: Bot, path: string) {
    super(bot);
    this.endpointPath = path;

    this.app = express();
    this.port = settings.express.port;
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

    DynamicLoader.loadFunctions(this.endpointPath, [this.app, this.bot]);

    // Log endpoint names
    this.app._router.stack.forEach((r: any) => {
      if (r.route && r.route.path) {
        this.bot.logger.info(`Registered the '${r.route.path}' endpoint!`);
      }
    });
  }
}
