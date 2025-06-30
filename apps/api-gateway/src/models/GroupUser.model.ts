import { Schema, model, Document } from 'mongoose'

export interface IGroupUser extends Document {
  userId: Schema.Types.ObjectId
  groupId: Schema.Types.ObjectId
  active: boolean
}

const GroupUserSchema = new Schema<IGroupUser>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  groupId: {
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