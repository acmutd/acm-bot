import { Schema, model, Document } from 'mongoose';

export interface Task extends Document {
    _id: string;
    task: () => void;
    cron: string;
}

const taskSchema = new Schema({
    _id: String,
    task: Function,
    cron: String,
});

export default model<Task>('task', taskSchema, 'tasks');
