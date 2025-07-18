import { Schema, model, Document } from 'mongoose'

export interface IApplication extends Document {
  name: string;
  description: string;
  threshold: number;
  timePeriod: number;
  active: boolean;
  deleted: boolean;
  notificationsEnabled: boolean;
}

const applicationSchema: Schema<IApplication> = new Schema(
  {
    name: {
      type: String,
      required: true,
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
    notificationsEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ active: 1, deleted: 1 }); // For filtering active/deleted apps
applicationSchema.index({ name: 1 }); // For name-based searches and sorting
applicationSchema.index({ name: 'text', description: 'text' }); // For text search

export default model<IApplication>('Application', applicationSchema);