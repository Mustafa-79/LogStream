// import mongoose from "mongoose";

// const logSchema = new mongoose.Schema({
//   date: { type: Date, required: true },
//   log_level: { type: String, required: true },
//   trace_id: { type: String },
//   message: { type: String, required: true },
//   source_app: { type: String },
//   metadata: { type: Object },
// }, { timestamps: true });

// export default mongoose.model("Log", logSchema);


import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILog extends Document {
  message: string;
  log_level: string;
  trace_id: string;
  source_app: mongoose.Types.ObjectId;
  date: Date;
}

const logSchema: Schema<ILog> = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    log_level: {
      type: String,
      required: true,
      enum: ['INFO', 'WARNING', 'ERROR', 'DEBUG'],
    },
    trace_id: {
      type: String,
      required: true,
    },
    source_app: {
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

const Log: Model<ILog> = mongoose.model<ILog>('Log', logSchema);
export default Log;