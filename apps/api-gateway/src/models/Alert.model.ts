import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  appId: string;
  errorCount: number;
  threshold: number;
  period: number;
  timestamp: Date;
  resolved: boolean;
}

const alertSchema = new Schema({
  appId: { type: String, required: true },
  errorCount: { type: Number, required: true },
  threshold: { type: Number, required: true },
  period: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false }
});

export default mongoose.model<IAlert>('Alert', alertSchema);
