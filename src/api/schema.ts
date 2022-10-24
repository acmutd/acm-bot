import { Schema, Document, model } from "mongoose";
import { TaskType } from "../util/manager/schedule";

// Types
export type ResponsesType = "strike" | "kick" | "ban" | "mute" | "caretaker";

// Document Models
export interface Member extends Document {
  _id: string;
  strikes: number;
  lastStrike: Date;
  preferences: {
    subscribed: boolean;
  };
}
export interface Response extends Document {
  type: ResponsesType;
  message: string;
}
export interface RRMessageData {
  _id: string;
  guild: string;
  channel: string;
  type: string;
  reactionRoles: any;
}
export interface RRMessage extends Document {
  _id: string;
  guild: string;
  channel: string;
  type: string;
  reactionRoles: any;
}
export interface TaskData extends Document {
  _id: string;
  type: TaskType;
  cron: string | Date;
  payload?: any;
}
export interface CircleData {
  _id?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  emoji?: string;
  createdOn?: Date;
  channel?: string;
  owner?: string;
  leaders: string[];
  subChannels: string[];
}
export interface CoperData {
  _id: string;
  score?: number;
}
export interface Coper extends Document {
  _id: string;
  score?: number;
}
export interface Circle extends Document {
  _id?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  emoji?: string;
  createdOn?: Date;
  channel?: string;
  owner?: string;
  leaders?: string[];
  subChannels?: string[];
}
export interface Guild extends Document {
  _id: string;
  channels: {
    verification: string;
    error: string;
    bulletin: string;
  };
  roles: {
    member: string;
    mute: string;
    director: string;
  };
  divisions: object;
  responses: {
    strike: string[];
    mute: string[];
    kick: string[];
    ban: string[];
  };
}

// Schema Generations
const memberSchema = new Schema({
  _id: String,
  strikes: Number,
  lastStrike: Date,
  preferences: {
    subscribed: Boolean,
  },
});
const responseSchema = new Schema({
  type: String,
  message: String,
});
const rrSchema = new Schema({
  _id: String,
  guild: String,
  channel: String,
  type: String,
  reactionRoles: Object,
});
const taskSchema = new Schema({
  _id: String,
  type: String,
});
const circleSchema = new Schema({
  _id: String,
  name: String,
  description: String,
  imageUrl: String,
  emoji: String,
  createdOn: Date,
  channel: String,
  owner: String,
  leaders: Array.from(String()),
  subChannels: Array.from(String()),
});
const coperSchema = new Schema({
  _id: String,
  score: Number,
});
const guildSchema = new Schema({
  _id: String,
  channels: {
    verification: String,
    error: String,
    bulletin: String,
  },
  roles: {
    member: String,
    mute: String,
    director: String,
  },
  divisions: Object,
  responses: {
    strike: Array,
    mute: Array,
    kick: Array,
    ban: Array,
  },
});

// Model Exports
export const MemberSchema = model<Member>("member", memberSchema, "members");
export const ResponseSchema = model<Response>(
  "response",
  responseSchema,
  "responses"
);
export const RRMessageSchema = model<RRMessage>(
  "rrmessage",
  rrSchema,
  "rrmessages"
);
export const TaskSchema = model<TaskData>("task", taskSchema, "tasks");
export const CircleSchema = model<Circle>("circle", circleSchema, "circles");
export const CoperSchema = model<Coper>("coper", coperSchema, "copers");
export const GuildSchema = model<Guild>("guild", guildSchema, "guilds");
