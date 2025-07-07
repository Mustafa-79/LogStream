import { Schema, model, Document } from 'mongoose'

export interface IGroup extends Document {
  name: string
  description: string
  memberIDs: Schema.Types.ObjectId[]
  applicationIDs: Schema.Types.ObjectId[]
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
  memberIDs: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  applicationIDs: [{
    type: Schema.Types.ObjectId,
    ref: 'Application',
  }],
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