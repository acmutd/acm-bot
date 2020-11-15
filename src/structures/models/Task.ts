import mongoose from 'mongoose';
require('mongoose-function')(mongoose);

export interface Task extends mongoose.Document {
    _id: string;
    task: () => void;
    cron: string;
}

const taskSchema = new mongoose.Schema({
    _id: String,
    task: Function,
    cron: String,
});

export default mongoose.model<Task>('task', taskSchema, 'tasks');
