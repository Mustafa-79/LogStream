import { Schema, model, Document } from 'mongoose'

export interface IGroup extends Document {
  name: string
  description: string
  active: boolean
  deleted: boolean
}

const GroupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 20,
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 100,
    trim: true,
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