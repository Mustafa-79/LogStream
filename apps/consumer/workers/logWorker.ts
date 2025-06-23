import { Worker, Job } from "bullmq";
import { appendFileSync, mkdirSync } from "fs";
import path from "path";

// Output file path setup
const outputDir = path.join(__dirname, "..", "out_logs");
const outputFile = path.join(outputDir, "consumer.log");

// Make sure output directory exists
mkdirSync(outputDir, { recursive: true });

// Redis connection options
const redisConnection = {
  host: "127.0.0.1",
  port: 6379,
};

// Create BullMQ Worker
export const worker = new Worker(
  "log_queue",
  async (job: Job) => {
    const logEntry = typeof job.data === "string" ? job.data : JSON.stringify(job.data);
    appendFileSync(outputFile, logEntry + "\n");
    console.log(`Processed job ${job.id}`);
  },
  { connection: redisConnection }
);

// Handle success/failure
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});
