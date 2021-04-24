import { Schema, model, Document } from 'mongoose';
export interface RRMessageData {
    _id: string;
    guild: string;
    channel: string;
    type: string;
    // object of emotes mapped to id of role { 🎲: "123123123123123" }
    reactionRoles: any;
}
export interface RRMessage extends Document {
    _id: string;
    guild: string;
    channel: string;
    type: string;
    reactionRoles: any;
}
// DB ReactionRole schema
const rrSchema = new Schema({
    _id: String,
    guild: String,
    channel: String,
    type: String,
    reactionRoles: Object,
});

export default model<RRMessage>('rrmessage', rrSchema, 'rrmessages');
