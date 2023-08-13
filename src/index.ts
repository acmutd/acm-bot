import Bot from "./api/bot";
import * as path from "path";
import { settings, settingsSchema } from "./settings";
import sourceMapSupport from "source-map-support";
import { Firestore } from "@google-cloud/firestore";

const main = async () => {
  const firestore = new Firestore({
    projectId: settings.firestore.projectId,
    keyFilename: settings.firestore.keyFilename,
  });

  const channelSettings = await firestore
    .collection("discord")
    .doc("channels")
    .get();
  const circleSettings = await firestore
    .collection("discord")
    .doc("circles")
    .get();
  const roleSettings = await firestore.collection("discord").doc("roles").get();

  const firebaseSettings = settingsSchema.parse({
    circles: circleSettings.data(),
    channels: channelSettings.data(),
    roles: roleSettings.data(),
  });

  const bot: Bot = new Bot({
    commandPath: path.join(process.cwd(), "dist", "command"),
    slashCommandPath: path.join(
      process.cwd(),
      "dist",
      "interaction",
      "command"
    ),
    cmCommandPath: path.join(
      process.cwd(),
      "dist",
      "interaction",
      "contextmenu"
    ),
    buttonPath: path.join(process.cwd(), "dist", "interaction", "button"),
    eventPath: path.join(process.cwd(), "dist", "event"),
    endpointPath: path.join(process.cwd(), "dist", "endpoint"),
    modalPath: path.join(process.cwd(), "dist", "interaction", "modal"),
    firebaseSettings,
  });
  bot.start();

  sourceMapSupport.install({
    handleUncaughtExceptions: false,
  });
};

main();
