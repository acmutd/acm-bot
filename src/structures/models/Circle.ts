import { Schema, model, Document } from 'mongoose';

export interface CircleData {
    // role id
    _id?: string;
    // basic
    name?: string;
    description?: string;
    // vanity
    imageUrl?: string;
    emoji?: string;
    createdOn?: Date;
    // ids
    channel?: string;
    owner?: string;
}

export interface Circle extends Document {
    _id: string;
    name: string;
    description: string;
    imageUrl: string;
    emoji: string;
    createdOn: Date;
    channel: string;
    owner: string;
}

const circleSchema = new Schema({
    _id: String,
    name: String,
    description: String,
    imageUrl: String,
    emoji: String,
    createdOn: Date,
    channel: String,
    owner: String,
});

export default model<Circle>('circle', circleSchema, 'circles');
