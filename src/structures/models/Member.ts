import { Schema, model, Document } from 'mongoose';

export interface Member extends Document {
    _id: string;
    strikes: number;
    lastStrike: Date;
    preferences: {
        subscribed: boolean;
    };
}
// DB Member Schema
const memberSchema = new Schema({
    _id: String,
    strikes: Number,
    lastStrike: Date,
    preferences: {
        subscribed: Boolean,
    },
});

export default model<Member>('member', memberSchema, 'members');
