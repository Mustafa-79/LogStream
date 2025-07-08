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

// Add indexes for analytics queries optimization
logSchema.index({ date: -1, sourceApp: 1 }); // For time-based filtering with app
logSchema.index({ date: -1, logLevel: 1 }); // For time-based filtering with log level
logSchema.index({ sourceApp: 1, logLevel: 1, date: -1 }); // For combined filters
logSchema.index({ date: -1 }); // For general time-based queries
logSchema.index({ logLevel: 1 }); // For log level aggregation
logSchema.index({ sourceApp: 1 }); // For application-based queries

export const Log: Model<ILog> = mongoose.model<ILog>('Log', logSchema);
