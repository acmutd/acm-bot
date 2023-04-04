import { z } from "zod";

// Types
export const responsesEnum = z.enum([
  "strike",
  "kick",
  "ban",
  "mute",
  "caretaker",
]);
export type IResponses = z.infer<typeof responsesEnum>;

// Document Models
export const memberSchema = z.object({
  _id: z.string(),
  strikes: z.number(),
  lastStrike: z.date(),
  preferences: z.object({
    subscribed: z.boolean(),
  }),
});
export type Member = z.infer<typeof memberSchema>;

export const responseSchema = z.object({
  type: responsesEnum,
  message: z.string(),
});
export type Response = z.infer<typeof responseSchema>;

export const rrMessageDataSchema = z.object({
  _id: z.string(),
  guild: z.string(),
  channel: z.string(),
  type: z.string(),
  reactionRoles: z.any(),
});

export type RRMessageData = z.infer<typeof rrMessageDataSchema>;

export const taskDataSchema = z.object({
  _id: z.string(),
  type: z.string(),
  cron: z.union([z.string(), z.date()]),
  payload: z.string().default(""),
});
export type Task = z.infer<typeof taskDataSchema>;

export const circleDataSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  emoji: z.string(),
  createdOn: z.date(),
  channel: z.string(),
  owner: z.string(),
  subChannels: z.array(z.string()).default([]),
});
export type Circle = z.infer<typeof circleDataSchema>;

export const coperSchema = z.object({
  _id: z.string(),
  score: z.number().default(0),
});
export type Coper = z.infer<typeof coperSchema>;

export const guildSchema = z.object({
  _id: z.string(),
  channels: z.object({
    verification: z.string(),
    error: z.string(),
    bulletin: z.string(),
  }),
  roles: z.object({
    member: z.string(),
    mute: z.string(),
    director: z.string(),
  }),
  divisions: z.any(),
  responses: z.object({
    strike: z.array(z.string()),
    mute: z.array(z.string()),
    kick: z.array(z.string()),
    ban: z.array(z.string()),
  }),
});
export type Guild = z.infer<typeof guildSchema>;

export const vcEventTypeEnum = z.enum(["starting", "ending soon", "ended"]);

export const vcEventSchema = z.object({
  _id: z.string(),
  title: z.string(),
  startsIn: z.date(),
  duration: z.number(),
  circleRole: z.string(),
  circle: circleDataSchema,
  type: vcEventTypeEnum,
  voiceChannel: z.string().optional(),
});

export type VCEvent = z.infer<typeof vcEventSchema>;
