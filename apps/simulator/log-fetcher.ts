import * as fs from "fs";
import * as path from "path";
import { MongoClient } from "mongodb";

const MONGO_URL = process.env.A5_MONGO_URL;
const DB_NAME = process.env.A5_DB_NAME;
const LOG_FILE = process.env.LOG_FILE_PATH || "/usr/src/app/logs/app.log";
const APP_NAME = process.env.APP_NAME || "app5";

let client: MongoClient;
let lastTimestamp = new Date(0);

function formatLog(entry: any): string {
  if (entry.timestamp && entry.level && entry.traceId && entry.message) {
    const ts = entry.timestamp instanceof Date ? entry.timestamp.toISOString() : new Date(entry.timestamp).toISOString();
    return `[${ts}] [${entry.level}] [${entry.traceId}] ${entry.message}\n`;
  }
  return entry.raw || JSON.stringify(entry) + '\n';
}

async function fetchLogs() {
  try {
    const logs = await client.db(DB_NAME).collection('logs')
      .find({ app: APP_NAME, createdAt: { $gt: lastTimestamp } })
      .sort({ createdAt: 1 })
      .toArray();
    
    if (logs.length > 0) {
      const content = logs.map(formatLog).join('');
      fs.appendFileSync(LOG_FILE, content);
      lastTimestamp = logs[logs.length - 1].createdAt;
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
  }
}

async function main() {
  if (!MONGO_URL) {
    console.error('MONGO_URL not set');
    process.exit(1);
  }
  
  client = new MongoClient(MONGO_URL);
  await client.connect();
  
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.writeFileSync(LOG_FILE, '');
  
  console.log('Log fetcher started');
  setInterval(fetchLogs, 5000);
  fetchLogs();
}

main().catch(console.error);
