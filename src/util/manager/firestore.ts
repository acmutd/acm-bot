import {
  IResponses,
  responsesEnum,
  taskDataSchema,
  VCEvent,
  vcEventSchema,
} from "./../../api/schema";
import Bot from "../../api/bot";
import { settings } from "../../settings";
import { Firestore } from "@google-cloud/firestore";
import Manager from "../../api/manager";
import {
  Circle,
  circleDataSchema,
  Coper,
  coperSchema,
  RRMessageData,
  rrMessageDataSchema,
  Task,
} from "../../api/schema";
import { z } from "zod";

export const cacheTypes = z.object({
  responses: z.map(z.string(), responsesEnum),
  rrmessages: z.map(z.string(), rrMessageDataSchema),
  circles: z.map(z.string(), circleDataSchema),
  copers: z.map(z.string(), coperSchema),
});

export type CacheTypes = z.infer<typeof cacheTypes>;

export const cacheKeys = z.enum([
  "responses",
  "rrmessages",
  "circles",
  "coper",
  "member",
  "task",
  "vcEvent",
]);

export type CacheKeys = z.infer<typeof cacheKeys>;

export default class FirestoreManager extends Manager {
  public firestore!: Firestore;
  public cache: CacheTypes;
  constructor(bot: Bot) {
    super(bot);
    this.cache = {
      responses: new Map(),
      rrmessages: new Map(),
      circles: new Map(),
      copers: new Map(),
    };
  }
  async init() {
    this.firestore = new Firestore({
      projectId: settings.firestore.projectId,
      keyFilename: settings.firestore.keyFilename,
    });
    await this.recache("responses", "responses");
    await this.recache("rrmessages", "rrmessages");
    await this.recache("circles", "circles");
    await this.recache("coper", "copers");
    this.bot.managers.scheduler.init();
  }

  private async recache(schema: CacheKeys, cache?: keyof CacheTypes) {
    try {
      const data = await this.firestore.collection(schema).get();
      if (cache) {
        this.cache[cache] = new Map();
        data.forEach((doc) => {
          // Firebase doesn't support Date objects, so we have to convert it to a Date object
          // This is a hacky way to do it, but it works
          if (cache === "circles") {
            let date = doc.data().createdOn.toDate();
            const circle = circleDataSchema.parse({
              ...doc.data(),
              createdOn: new Date(date),
            });
            this.cache[cache]?.set(doc.id, circle);
          } else {
            this.cache[cache]?.set(doc.id, doc.data() as any);
          }
        });
      }
    } catch (error: any) {
      this.bot.logger.error(error, "Error recaching firestore data");
    }
  }

  public async manualRecache(schema: CacheKeys): Promise<boolean> {
    try {
      await this.recache(schema);
      this.bot.logger.database("Recached firestore data", schema);
      return true;
    } catch (error: any) {
      this.bot.logger.error(error, `Error recaching ${schema} from firestore`);
      return false;
    }
  }

  public async responseAdd(
    type: IResponses,
    message: string
  ): Promise<boolean> {
    try {
      await this.firestore.collection("responses").add({
        type,
        message,
      });
      await this.recache("responses");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, "Error adding response to firestore");
      return false;
    }
  }

  public async responseDelete(message: string): Promise<boolean> {
    try {
      const data = await this.firestore
        .collection("responses")
        .where("message", "==", message)
        .get();
      data.forEach((doc) => {
        doc.ref.delete();
      });
      await this.recache("responses");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, "Error deleting response from firestore");
      return false;
    }
  }

  public async rrmsgAdd(newData: RRMessageData) {
    await this.firestore.collection("rrmessage").add(newData);
    await this.recache("rrmessages");
  }

  public async coperFetch(): Promise<[string, number][]> {
    const data = await this.firestore.collection("coper").get();
    const result: [string, number][] = [];
    data.forEach((doc) => {
      const coper = coperSchema.parse(doc.data());
      result.push([coper._id, coper.score]);
    });
    result.sort((a, b) => b[1] - a[1]);
    return result.slice(0, Math.min(5, result.length));
  }

  public async coperUpdate(id: string, newData: Coper) {
    try {
      await this.firestore.collection("coper").doc(id).set(newData);
      await this.recache("coper");
    } catch (e: any) {
      this.bot.logger.error(e, "Error updating coper in firestore");
      return false;
    }
  }

  public async coperAdd(coperData: Coper): Promise<boolean> {
    try {
      await this.firestore
        .collection("coper")
        .doc(coperData._id)
        .set(coperData);
      await this.recache("coper");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, "Error adding coper to firestore");
      return false;
    }
  }

  public async coperIncrement(id: string) {
    const coper = this.cache.copers.get(id);
    if (!coper) {
      await this.coperAdd({
        _id: id,
        score: 1,
      });
    } else {
      await this.coperUpdate(id, {
        _id: id,
        score: coper.score + 1,
      });
    }
  }

  public async coperRemove(id: string): Promise<boolean> {
    try {
      await this.firestore.collection("coper").doc(id).delete();
      await this.recache("coper");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, "Error removing coper from firestore");
      return false;
    }
  }

  public async circleAdd(circleData: Circle): Promise<boolean> {
    try {
      await this.firestore
        .collection("circles")
        .doc(circleData._id)
        .set(circleData);
      await this.recache("circles");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, `Error adding circle ${circleData.name}`);
      return false;
    }
  }

  public async circleRemove(id: string): Promise<boolean> {
    try {
      await this.firestore.collection("circles").doc(id).delete();
      await this.recache("circles");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, `Error removing circle ${id}`);
      return false;
    }
  }

  public async circleUpdate(id: string, newData: Partial<Circle>) {
    try {
      await this.firestore.collection("circle").doc(id).set(newData);
      await this.recache("circles");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, "Error updating circle in firestore");
      return false;
    }
  }

  public async fetchTasks(): Promise<Task[]> {
    const data = await this.firestore.collection("task").get();
    const result: Task[] = [];
    data.forEach((doc) => {
      const task = taskDataSchema.parse(doc.data());
      result.push(task);
    });
    return result;
  }

  public async fetchVCTasks(): Promise<VCEvent[]> {
    const data = await this.firestore.collection("vctask").get();
    const result: VCEvent[] = [];
    data.forEach((doc) => {
      const task = vcEventSchema.parse(doc.data());
      result.push(task);
    });
    return result;
  }

  public async findTask(id: string): Promise<Task | undefined> {
    const data = await this.firestore.collection("task").doc(id).get();
    if (data.exists) {
      const task = taskDataSchema.parse(data.data());
      return task;
    }
    return undefined;
  }

  public async createTask(taskData: Task): Promise<boolean> {
    try {
      await this.firestore.collection("task").doc(taskData._id).set(taskData);
      await this.recache("task");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, "Error creating task");
      return false;
    }
  }

  public async deleteTask(id: string): Promise<boolean> {
    try {
      await this.firestore.collection("task").doc(id).delete();
      await this.recache("task");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, "Error deleting task");
      return false;
    }
  }

  public async findVCEvent(id: string): Promise<VCEvent | undefined> {
    const data = await this.firestore.collection("vcevent").doc(id).get();
    if (data.exists) {
      const event = vcEventSchema.parse(data.data());
      return event;
    }
    return undefined;
  }

  public async createVCEvent(eventData: VCEvent): Promise<boolean> {
    try {
      await this.firestore
        .collection("vcEvent")
        .doc(eventData._id)
        .set(eventData);
      await this.recache("vcEvent");
      return true;
    } catch (e: any) {
      this.bot.logger.error(
        e,
        `Error creating vc event for ${eventData.title}`
      );
      return false;
    }
  }

  public async deleteVCEvent(id: string): Promise<boolean> {
    try {
      await this.firestore.collection("vcEvent").doc(id).delete();
      await this.recache("vcEvent");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, "Error deleting vc event");
      return false;
    }
  }

  public async updateVCEvent(id: string, newData: Partial<VCEvent>) {
    try {
      await this.firestore
        .collection("vcEvent")
        .doc(id)
        .set(newData, { merge: true });
      await this.recache("vcEvent");
    } catch (e: any) {
      this.bot.logger.error(e, "Error updating vc event in firestore");
      return false;
    }
  }
}
