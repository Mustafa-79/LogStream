import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILog extends Document {
  message: string;
  logLevel: string;
  traceId: string;
  sourceApp: mongoose.Types.ObjectId;
  date: Date;
}

const logSchema: Schema<ILog> = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    logLevel: {
      type: String,
      required: true,
      enum: ['INFO', 'WARNING', 'ERROR', 'DEBUG'],
    },
    traceId: {
      type: String,
      required: true,
    },
    sourceApp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Log: Model<ILog> = mongoose.model<ILog>('Log', logSchema);
