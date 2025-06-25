import { Schema, model, Document } from 'mongoose'

export interface IGroup extends Document {
  name: string
  description: string
  created_on: Date
  updated_on: Date
  active: boolean
  deleted: boolean
}

const GroupSchema = new Schema<IGroup>({
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
  active: {
    type: Boolean,
    default: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

export default model<IGroup>('Group', GroupSchema)