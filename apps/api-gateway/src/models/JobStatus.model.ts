import mongoose from 'mongoose';

const jobStatusSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['queued', 'processing', 'completed', 'failed', 'stuck'], 
    default: 'queued' 
  },
  step: String,
  progress: { type: Number, default: 0 },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date,
  failedAt: Date,
  error: String,
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 }
});

jobStatusSchema.index({ userId: 1, createdAt: -1 });
jobStatusSchema.index({ status: 1, updatedAt: 1 });

export const JobStatusModel = mongoose.model('JobStatus', jobStatusSchema);