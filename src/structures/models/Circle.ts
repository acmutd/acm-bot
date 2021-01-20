import { Schema, model, Document } from 'mongoose';

export interface Circle extends Document {
    _id: string;
    name: string;
    description: string;
    imageUrl: string;
    emoji: string;
    createdOn: Date;
    category: string;
    owner: string;
}

const circleSchema = new Schema({
    _id: String,
    name: String,
    description: String,
    imageUrl: String,
    emoji: String,
    createdOn: Date,
    categoryId: String,
    ownerId: String,
});

export default model<Circle>('circle', circleSchema, 'circles');
