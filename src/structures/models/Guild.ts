import { Schema, model, Document } from 'mongoose';

export interface Guild extends Document {
    _id: String;
    channels: {
        confirmation: string;
        error: string;
        bulletin: string;
    };
    roles: {
        member: string;
        mute: string;
    };
    divisions: Object;
    responses: {
        strike: string[];
        mute: string[];
        kick: string[];
        ban: string[];
    };
}

const guildSchema = new Schema({
    _id: String,
    channels: {
        confirmation: String,
        error: String,
        bulletin: String,
    },
    roles: {
        member: String,
        mute: String,
    },
    divisions: Object,
    responses: {
        strike: Array,
        mute: Array,
        kick: Array,
        ban: Array,
    },
});

export default model<Guild>('guild', guildSchema, 'guilds');
