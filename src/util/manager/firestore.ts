import Bot from "../../api/bot";
import { settings } from "../../settings";
import { Firestore } from "@google-cloud/firestore";
import Manager from "../../api/manager";

export default class FirestoreManager extends Manager {
  public firestore: Firestore | undefined;
  constructor(bot: Bot) {
    super(bot);
  }
  async init() {
    this.firestore = new Firestore({
      projectId: settings.firestore.projectId,
      keyFilename: settings.firestore.keyFilename,
    });
  }
}
