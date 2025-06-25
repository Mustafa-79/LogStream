//// filepath: /home/mustafaabbas/Work/Probation/LogStream/LogStream/apps/api-gateway/src/models/Application.model.ts
import { Schema, model, Document } from 'mongoose'

export interface IApplication extends Document {
  name: string;
  description: string;
  threshold: number;
  timePeriod: number;
  active: boolean;
  deleted: boolean;
}

const applicationSchema: Schema<IApplication> = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
      default: 10,
    },
    timePeriod: {
      type: Number,
      required: true,
      default: 5,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    deleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


export default model<IApplication>('Application', applicationSchema);