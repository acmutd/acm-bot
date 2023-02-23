import { z } from "zod";

// Types
export const Responses = z.enum(["strike", "kick", "ban", "mute", "caretaker"]);
export type ResponseType = z.infer<typeof Responses>;

// Document Models
export const member = z.object({
  _id: z.string(),
  strikes: z.number(),
  lastStrike: z.date(),
  preferences: z.object({
    subscribed: z.boolean(),
  }),
});
export type Member = z.infer<typeof member>;

export const response = z.object({
  type: Responses,
  message: z.string(),
});
export type Response = z.infer<typeof response>;

export const rrMessageData = z.object({
  _id: z.string(),
  guild: z.string(),
  channel: z.string(),
  type: z.string(),
  reactionRoles: z.any(),
});

export type RRMessageData = z.infer<typeof rrMessageData>;

export const TaskData = z.object({
  _id: z.string(),
  type: z.string(),
  cron: z.union([z.string(), z.date()]),
  payload: z.any().optional(),
});
export type Task = z.infer<typeof TaskData>;

export const CircleData = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  emoji: z.string(),
  createdOn: z.date(),
  channel: z.string(),
  owner: z.string(),
  subChannels: z.array(z.string()),
});
export type Circle = z.infer<typeof CircleData>;

export const CoperData = z.object({
  _id: z.string(),
  score: z.number().default(0),
});
export type Coper = z.infer<typeof CoperData>;

export const guild = z.object({
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
export type Guild = z.infer<typeof guild>;
