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
  public firestore: Firestore;
  public cache: CacheTypes;
  constructor(bot: Bot) {
    super(bot);
    this.firestore = new Firestore({
      projectId: settings.firestore.projectId,
      keyFilename: settings.firestore.keyFilename,
    });
    this.cache = {
      responses: new Map(),
      rrmessages: new Map(),
      circles: new Map(),
      copers: new Map(),
    };
  }
  async init() {
    await this.recache("responses", "responses");
    await this.recache("rrmessages", "rrmessages");
    await this.recache("circles", "circles");
    await this.recache("coper", "copers");
  }

  private async recache(schema: CacheKeys, cache?: keyof CacheTypes) {
    try {
      const data = await this.firestore.collection(schema).get();
      if (!cache) return;

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
    } catch (error: any) {
      this.bot.logger.error(error, "Error recaching firestore data");
    }
  }

  public async manualRecache(schema: CacheKeys): Promise<boolean> {
    try {
      const cacheName = schema as keyof CacheTypes;
      await this.recache(schema, cacheName);
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
      await this.recache("responses", "responses");
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
    await this.recache("rrmessages", "rrmessages");
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
      await this.recache("coper", "copers");
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
      await this.recache("coper", "copers");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, "Error adding coper to firestore");
      return false;
    }
  }

  public async coperIncrement(id: string) {
    const coper = this.cache.copers.get(id);
    // If the coper doesn't exist, create it
    if (!coper) return await this.coperAdd({ _id: id, score: 1 });
    // Otherwise, increment the score
    await this.coperUpdate(id, { _id: id, score: coper.score + 1 });
  }

  public async coperRemove(id: string): Promise<boolean> {
    try {
      await this.firestore.collection("coper").doc(id).delete();
      await this.recache("coper", "copers");
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
      await this.recache("circles", "circles");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, `Error adding circle ${circleData.name}`);
      return false;
    }
  }

  public async circleRemove(id: string): Promise<boolean> {
    try {
      await this.firestore.collection("circles").doc(id).delete();
      await this.recache("circles", "circles");
      return true;
    } catch (e: any) {
      this.bot.logger.error(e, `Error removing circle ${id}`);
      return false;
    }
  }

  public async circleUpdate(id: string, newData: Partial<Circle>) {
    try {
      await this.firestore.collection("circles").doc(id).update(newData);
      await this.recache("circles", "circles");
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
      if (!doc.exists) return;
      const docData = doc.data();
      if (!docData) return;
      const task = taskDataSchema.parse(docData);
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
    const data = await this.firestore.collection("task").get();
    // Should only be one
    const doc = data.docs.find((doc) => doc.data().id === id);
    if (!doc) return;
    const task = taskDataSchema.parse(doc.data());
    return task;
  }

  public async createTask(taskData: Task): Promise<boolean> {
    try {
      await this.firestore.collection("task").doc(taskData.id).set(taskData);
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
    if (!data.exists) return undefined;

    const event = vcEventSchema.parse(data.data());
    return event;
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

  public async verification(memberId: string, content: string) {
    const obj: { [key: string]: string } = {};
    try {
      obj[memberId] = content;
      await this.firestore
        .collection("discord")
        .doc("snowflake_to_name")
        .set(obj, { merge: true });
    } catch (e: any) {
      this.bot.logger.error(e, "Error updating verification");
    }
  }

  /**
   * Checks if a user is verified
   * @param memberId
   * @returns The name of the user if they are verified, undefined otherwise
   */
  public async isVerified(memberId: string): Promise<string | undefined> {
    return await this.getVerifiedName(memberId);
  }

  // Maybe implement cache?
  private async getVerifiedName(memberId: string): Promise<string | undefined> {
    const data = await this.firestore
      .collection("discord")
      .doc("snowflake_to_name")
      .get();

    // If the data doesn't exist, return undefined
    return (data?.exists && data?.data()?.[memberId]) ?? undefined;
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
