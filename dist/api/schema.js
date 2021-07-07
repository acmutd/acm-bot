"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildSchema = exports.CircleSchema = exports.TaskSchema = exports.RRMessageSchema = exports.ResponseSchema = exports.MemberSchema = void 0;
const mongoose_1 = require("mongoose");
// Schema Generations
const memberSchema = new mongoose_1.Schema({
    _id: String,
    strikes: Number,
    lastStrike: Date,
    preferences: {
        subscribed: Boolean
    }
});
const responseSchema = new mongoose_1.Schema({
    type: String,
    message: String
});
const rrSchema = new mongoose_1.Schema({
    _id: String,
    guild: String,
    channel: String,
    type: String,
    reactionRoles: Object
});
const taskSchema = new mongoose_1.Schema({
    _id: String,
    type: String
});
const circleSchema = new mongoose_1.Schema({
    _id: String,
    name: String,
    description: String,
    imageUrl: String,
    emoji: String,
    createdOn: Date,
    channel: String,
    owner: String
});
const guildSchema = new mongoose_1.Schema({
    _id: String,
    channels: {
        verification: String,
        error: String,
        bulletin: String
    },
    roles: {
        member: String,
        mute: String,
        director: String
    },
    divisions: Object,
    responses: {
        strike: Array,
        mute: Array,
        kick: Array,
        ban: Array
    }
});
// Model Exports
exports.MemberSchema = mongoose_1.model('member', memberSchema, 'members');
exports.ResponseSchema = mongoose_1.model('response', responseSchema, 'responses');
exports.RRMessageSchema = mongoose_1.model('rrmessage', rrSchema, 'rrmessages');
exports.TaskSchema = mongoose_1.model('task', taskSchema, 'tasks');
exports.CircleSchema = mongoose_1.model('circle', circleSchema, 'circles');
exports.GuildSchema = mongoose_1.model('guild', guildSchema, 'guilds');
