import { Schema, model, Document } from 'mongoose';

export interface RRMessage extends Document {
    _id: string;
    guild: string;
    channel: string;
    type: string;
    reactionRoles: any;
}

const rrSchema = new Schema({
    _id: String,
    guild: String,
    channel: String,
    type: String,
    reactionRoles: Object,
});

export default model<RRMessage>('rrmessage', rrSchema, 'rrmessages');
