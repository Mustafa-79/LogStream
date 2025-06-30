import { Schema, model, Document } from 'mongoose'

export interface IUser extends Document {
  username: string
  email: string
  active: boolean
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
}, {
  timestamps: true,
})


export default model<IUser>('User', UserSchema)