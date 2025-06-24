import { Schema, model, Document } from 'mongoose'

export interface IUserGroup extends Document {
  user_id: Schema.Types.ObjectId
  group_id: Schema.Types.ObjectId
  active: boolean
  created_at: Date
  updated_at: Date
}

const UserGroupSchema = new Schema<IUserGroup>({
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
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
})

UserGroupSchema.pre<IUserGroup>('save', function (next) {
  this.updated_at = new Date()
  next()
})

export default model<IUserGroup>('UserGroup', UserGroupSchema)