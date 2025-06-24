import { Schema, model, Document } from 'mongoose'

export interface IGroupApplication extends Document {
  group_id: Schema.Types.ObjectId
  application_id: Schema.Types.ObjectId
  active: boolean
  created_at: Date
  updated_at: Date
}

const GroupApplicationSchema = new Schema<IGroupApplication>({
  group_id: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  application_id: {
    type: Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
})

GroupApplicationSchema.pre<IGroupApplication>('save', function (next) {
  this.updated_at = new Date()
  next()
})

export default model<IGroupApplication>('GroupApplication', GroupApplicationSchema)