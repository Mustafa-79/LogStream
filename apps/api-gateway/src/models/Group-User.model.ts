import { Schema, model, Document } from 'mongoose'

export interface IGroupUser extends Document {
  user_id: Schema.Types.ObjectId
  group_id: Schema.Types.ObjectId
  active: boolean
  created_on: Date
  updated_on: Date
}

const GroupUserSchema = new Schema<IGroupUser>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group_id: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
})

export default model<IGroupUser>('GroupUser', GroupUserSchema)