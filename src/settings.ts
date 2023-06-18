import { ActivityType } from "discord.js";

import { ResponseFormat } from "./util/response";
import { z } from "zod";
interface BotConfig {
  token: string;
  prefix: string;
  activity: {
    type:
      | ActivityType.Competing
      | ActivityType.Listening
      | ActivityType.Playing
      | ActivityType.Streaming
      | ActivityType.Watching;

    description: string;
  };
  sentryDNS: string;
  firestore: {
    projectId: string;
    keyFilename: string;
  };
  express: {
    port: number;
  };
  keys: {
    sheets: string;
  };
  responseFormat: ResponseFormat;
  disabledCommands: string[];
  disabledCategories: string[];
  guild: string;
  acmLogoURL: string;
  points: {
    privateChannel: string;
    publicChannel: string;
    staffRole: string;
    firebaseRoot: string;
  };
}
export const settings: BotConfig = require("../botconfig.js") as BotConfig;

export const circleSettingsSchema = z.object({
  joinChannel: z.string().min(1),
  leaderChannel: z.string().min(1),
  parentCategory: z.string().min(1),
  remindCron: z.string().min(1),
  remindThresholdDays: z.number(),
});

export type CircleSettings = z.infer<typeof circleSettingsSchema>;

export const channelsSettingsSchema = z.object({
  error: z.string().min(1),
  verification: z.string().min(1),
  mod: z.string().min(1),
  roles: z.string().min(1),
  shoutout: z.string().min(1),
});

export type ChannelsSettings = z.infer<typeof channelsSettingsSchema>;

export const rolesSettingsSchema = z.object({
  circleLeaders: z.string().min(1),
  director: z.string().min(1),
  divisions: z.object({
    education: z.string().min(1),
    hackutd: z.string().min(1),
    projects: z.string().min(1),
  }),
  member: z.string().min(1),
  mute: z.string().min(1),
  staff: z.string().min(1),
});

export type RolesSettings = z.infer<typeof rolesSettingsSchema>;

export const settingsSchema = z.object({
  circles: circleSettingsSchema,
  channels: channelsSettingsSchema,
  roles: rolesSettingsSchema,
});

export type FirebaseSettings = z.infer<typeof settingsSchema>;

export type Settings = BotConfig & FirebaseSettings;
