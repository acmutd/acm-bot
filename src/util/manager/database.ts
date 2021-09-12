import Bot, { Config } from "../../api/bot";
import Manager from "../../api/manager";
import { Collection } from "discord.js";
import mongoose, { Model } from "mongoose";
import {
  Member,
  Response,
  RRMessage,
  RRMessageData,
  TaskData,
  Circle,
  CircleData,
  MemberSchema,
  ResponseSchema,
  RRMessageSchema,
  TaskSchema,
  CircleSchema,
} from "../../api/schema";
import { settings } from "../../settings";

export interface SchemaTypes {
  member: Model<Member>;
  response: Model<Response>;
  rrmessage: Model<RRMessage>;
  task: Model<TaskData>;
  circle: Model<Circle>;
}
export interface CacheTypes {
  responses: Collection<string, Response>;
  rrmessages: Collection<string, RRMessage>;
  circles: Collection<string, Circle>;
}

export default class DatabaseManager extends Manager {
  public url: string;
  public m!: typeof mongoose;
  public schemas: SchemaTypes;
  public cache: CacheTypes;

  constructor(bot: Bot, config: Config) {
    super(bot);
    this.cache = {
      responses: new Collection(),
      rrmessages: new Collection(),
      circles: new Collection(),
    };
    this.url = config.dbUrl;
    this.schemas = {
      member: MemberSchema,
      response: ResponseSchema,
      rrmessage: RRMessageSchema,
      task: TaskSchema,
      circle: CircleSchema,
    };
  }

  public init(): void {
    const setup = async () => {
      try {
        await this.connect();
        await this.recache("response");
        await this.recache("rrmessage");
        await this.recache("circle");
      } catch (e) {
        this.bot.logger.error(e);
      }
    };
    setup().then(() => {
      this.bot.logger.info(
        "Cached circle, response, and reaction role data..."
      );
    });
  }
  private async connect() {
    this.m = await mongoose.connect(this.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    this.m.connection.on("error", (err) => {
      this.bot.logger.error("Database connection error...");
      this.bot.logger.error(err);
    });
  }
  public dispose() {
    this.m.connection.close();
    this.bot.logger.database("Closed database connection...");
  }
  private async recache(schema: keyof SchemaTypes, cache?: keyof CacheTypes) {
    try {
      const docs = await (this.schemas[schema] as Model<any>).find({});
      this.cache[cache ?? (`${schema}s` as keyof CacheTypes)] = new Collection<
        string,
        any
      >();
      docs.forEach((doc) => {
        this.cache[cache ?? (`${schema}s` as keyof CacheTypes)].set(
          doc["_id"] as string,
          doc
        );
      });
    } catch (e) {
      this.bot.logger.error(e);
    }
  }
  public async responseAdd(
    type: ResponseType,
    message: string
  ): Promise<boolean> {
    try {
      await this.schemas.response.create({ type, message });
      await this.recache("response");
      return true;
    } catch (e) {
      return false;
    }
  }
  public async responseDelete(message: string): Promise<boolean> {
    try {
      await this.schemas.response.findOneAndDelete({ message });
      await this.recache("response");
      return true;
    } catch (e) {
      return false;
    }
  }
  public async rrmsgAdd(newData: RRMessageData) {
    await this.schemas.rrmessage.create(newData);
    await this.recache("rrmessage");
  }
  public async rrmsgDelete(id: string) {}
  public async circleAdd(circleData: CircleData): Promise<boolean> {
    try {
      await this.schemas.circle.create(circleData);
      await this.recache("circle");
      return true;
    } catch (e) {
      return false;
    }
  }
  public async circleRemove(circleId: string): Promise<boolean> {
    try {
      await this.schemas.circle.findByIdAndDelete(circleId);
      await this.recache("circle");
      return true;
    } catch (e) {
      return false;
    }
  }
  public async circleUpdate(
    circleId: string,
    newData: CircleData
  ): Promise<boolean> {
    try {
      await this.schemas.circle.findByIdAndUpdate(circleId, newData);
      await this.recache("circle");
      return true;
    } catch (e) {
      return false;
    }
  }
}
