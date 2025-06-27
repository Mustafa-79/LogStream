// import { Worker, Job } from "bullmq";
// import { appendFileSync, mkdirSync } from "fs";
// import path from "path";

// // Output file path setup
// const outputDir = path.join(__dirname, "..", "out_logs");
// const outputFile = path.join(outputDir, "consumer.log");

// // Make sure output directory exists
// mkdirSync(outputDir, { recursive: true });

// // Redis connection options
// const redisConnection = {
//   host: "redis",
//   port: 6379,
// };

// // Create BullMQ Worker
// export const worker = new Worker(
//   "log_queue",
//   async (job: Job) => {
//     const logEntry = typeof job.data === "string" ? job.data : JSON.stringify(job.data);
//     appendFileSync(outputFile, logEntry + "\n");
//     console.log(`Processed job ${job.id}`);
//   },
//   { connection: redisConnection }
// );

// // Handle success/failure
// worker.on("completed", (job) => {
//   console.log(`✅ Job ${job.id} completed.`);
// });

// worker.on("failed", (job, err) => {
//   console.error(`❌ Job ${job?.id} failed: ${err.message}`);
// });

import { Worker, Job } from "bullmq";
import mongoose from "mongoose";
import Log from "./logSchema";
import { parseLogLine } from "./logParser";

// Connect to MongoDB (use your connection string)
const mongoUrl = process.env.MONGODB_URL || "mongodb://mongo:27017/logstream";
mongoose.connect(mongoUrl)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Redis connection options
const redisConnection = {
  host: "redis",
  port: 6379,
};

export const worker = new Worker(
  "log_queue",
  async (job: Job) => {
    let parsed: any;

    // print job data to console for debugging
    console.log(`Received job ${job.id} with data:`, job.data);

    // If job.data is a string, try to parse as JSON, else parse as log line
    if (typeof job.data === "string") {
      try {
        const asJson = JSON.parse(job.data);
        parsed = asJson;
      } catch {
        parsed = parseLogLine(job.data);
      }
    } else if (typeof job.data === "object" && job.data !== null) {
      parsed = job.data;
    }

    if (parsed) {

      console.log(`Processing job ${job.id} with data:`, parsed);
      // Create log entry according to the schema
      const logEntry = {
        message: parsed.message || parsed.log_message || "",
        logLevel: parsed.logLevel || parsed.log_level || parsed.level || "INFO",
        traceId: parsed.traceId || parsed.trace_id || "",
        sourceApp: parsed.sourceApp || parsed.source_app || "unknown",
        date: parsed.timestamp || new Date(),
      };

      await Log.create(logEntry);
      console.log(`Saved log to MongoDB:`, logEntry);
    } else {
      console.warn(`Could not parse log: ${JSON.stringify(job.data)}`);
    }
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});