import { Schema, model, Document } from 'mongoose'

export interface IUser extends Document {
  username: string
  email: string
  active: boolean
  created_at: Date
  updated_at: Date
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
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

UserSchema.pre<IUser>('save', function (next) {
  this.updated_at = new Date()
  next()
})

export default model<IUser>('User', UserSchema)