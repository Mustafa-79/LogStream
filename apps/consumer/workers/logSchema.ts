import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  log_level: { type: String, required: true },
  trace_id: { type: String },
  message: { type: String, required: true },
  source_app: { type: String },
  metadata: { type: Object },
}, { timestamps: true });

export default mongoose.model("Log", logSchema);