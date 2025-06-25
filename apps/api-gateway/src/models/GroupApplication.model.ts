import { Schema, model, Document } from 'mongoose'

export interface IGroupApplication extends Document {
  groupId: Schema.Types.ObjectId
  applicationId: Schema.Types.ObjectId
  active: boolean
}

const GroupApplicationSchema = new Schema<IGroupApplication>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  applicationId: {
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