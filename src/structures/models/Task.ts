import mongoose from 'mongoose';
import { TaskType } from '../managers/ScheduleManager';
require('mongoose-function')(mongoose);

export interface TaskData extends mongoose.Document {
    _id: string;
    type: TaskType;
    cron: string;
}

const taskSchema = new mongoose.Schema(
    {
        _id: String,
        type: String,
        cron: String,
    },
    { strict: false }
);

export default mongoose.model<TaskData>('task', taskSchema, 'tasks');
