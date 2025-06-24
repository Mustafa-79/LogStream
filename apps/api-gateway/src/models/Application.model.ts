//// filepath: /home/mustafaabbas/Work/Probation/LogStream/LogStream/apps/api-gateway/src/models/Application.model.ts
import { Schema, model, Document } from 'mongoose'

export interface IApplication extends Document {
  name: string
  description: string
  created_on: Date
  updated_on: Date
  threshold: number
  time_period: number
  active: boolean
  deleted: boolean
}

const ApplicationSchema = new Schema<IApplication>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  created_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now,
  },
  threshold: {
    type: Number,
    default: 0,
  },
  time_period: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
})

ApplicationSchema.pre<IApplication>('save', function (next) {
  this.updated_on = new Date()
  next()
})

export default model<IApplication>('Application', ApplicationSchema)