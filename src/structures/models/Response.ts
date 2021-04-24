import { Schema, model, Document } from 'mongoose';

export type ResponsesType = 'strike' | 'kick' | 'ban' | 'mute' | 'caretaker';

export interface Response extends Document {
    type: ResponsesType;
    message: String;
}
// DB Response Schema
const responseSchema = new Schema({
    type: String,
    message: String,
});

export default model<Response>('response', responseSchema, 'responses');
