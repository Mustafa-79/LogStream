import { Schema, model, Document } from 'mongoose'

export interface IGroupApplication extends Document {
  group_id: Schema.Types.ObjectId
  application_id: Schema.Types.ObjectId
  active: boolean
  created_on: Date
  updated_on: Date
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
}, {
  timestamps: true,
})


export default model<IGroupApplication>('GroupApplication', GroupApplicationSchema)