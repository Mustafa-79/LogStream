import { Schema, model, Document } from 'mongoose';

export interface IStarredMessage extends Document {
  userId: Schema.Types.ObjectId;
  messageContent: string;
  createdAt: Date;
  updatedAt: Date;
}

const starredMessageSchema = new Schema<IStarredMessage>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messageContent: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
starredMessageSchema.index({ userId: 1, createdAt: -1 });
starredMessageSchema.index({ userId: 1, messageContent: 1 });

export default model<IStarredMessage>('StarredMessage', starredMessageSchema);
