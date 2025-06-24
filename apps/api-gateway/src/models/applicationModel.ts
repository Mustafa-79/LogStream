import mongoose, { Schema, Document, Model } from 'mongoose';
import Joi from 'joi';

export interface IApplication extends Document {
  name: string;
  description: string;
  threshold: number;
  time_period: number;
  active: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
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
    time_period: {
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

export const Application: Model<IApplication> = mongoose.model<IApplication>('Application', applicationSchema);

export type ApplicationInput = {
  name: string;
  description: string;
  threshold: number;
  time_period: number;
  active: boolean;
  deleted: boolean;
};

export const validateApplication = (data: ApplicationInput) => {
  const schema = Joi.object({
    name: Joi.string().required().label('Name'),
    description: Joi.string().required().label('Description'),
    threshold: Joi.number().required().default(10).label('Threshold'),
    time_period: Joi.number().required().default(5).label('Time Period'),
    active: Joi.boolean().required().default(true).label('Active'),
    deleted: Joi.boolean().required().default(false).label('Deleted'),
  });

  return schema.validate(data);
};