import * as fs from "fs";
import * as path from "path";
import { MongoClient } from "mongodb";

const APP_NAME = process.env.APP_NAME || "default-app";
const MONGO_URL = process.env.A5_MONGO_URL;
const DB_NAME = process.env.A5_DB_NAME;

let mongoClient: MongoClient;
let logsCollection: any;

const levels = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
const messages: { [key: string]: string[] } = {
  app1: ["User authentication successful", "Database connection established", "Processing payment transaction"],
  app2: ["File upload completed", "Email notification sent", "Background job started"],
  app3: ["Order processing initiated", "Inventory updated", "Shipping label generated"],
  app4: ["Data synchronization completed", "Backup created successfully", "User profile updated"],
  app5: ["Payment gateway response received", "Third-party API call successful", "User feedback submitted"],
  "default-app": ["Generic application log message", "System operation completed", "Process executed successfully"]
};

const logPath = path.join(__dirname, "logs", "app.log");

// Initialize MongoDB for app5
async function initMongoDB() {
  if (APP_NAME === 'app5' && MONGO_URL) {
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
    logsCollection = mongoClient.db(DB_NAME).collection('logs');
    await logsCollection.deleteMany({});
    console.log(`Connected to MongoDB and emptied the logs collection`);
  }
}

// Setup log file for apps 1-3
if (!['app4', 'app5'].includes(APP_NAME)) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, '');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateLog() {
  const level = levels[Math.floor(Math.random() * levels.length)];
  const traceId = generateId();
  const appMessages = messages[APP_NAME] || messages["default-app"];
  const message = appMessages[Math.floor(Math.random() * appMessages.length)];
  const timestamp = new Date().toISOString();
  
  return `[${timestamp}] [${level}] [${traceId}] ${message}\n`;
}

function writeLog() {
  const logEntry = generateLog();
  
  if (APP_NAME === 'app4') {
    process.stdout.write(logEntry);
  } else if (APP_NAME === 'app5') {
    writeToMongoDB(logEntry);
  } else {
    fs.appendFileSync(logPath, logEntry);
  }
}

async function writeToMongoDB(logEntry: string) {
  try {
    const match = logEntry.match(/\[(.*?)\] \[(.*?)\] \[(.*?)\] (.*)/);
    const logData = match ? {
      timestamp: new Date(match[1]),
      level: match[2],
      traceId: match[3],
      message: match[4].trim(),
      app: APP_NAME,
      createdAt: new Date()
    } : {
      raw: logEntry.trim(),
      app: APP_NAME,
      createdAt: new Date()
    };
    
    await logsCollection.insertOne(logData);
  } catch (error) {
    console.error(`Failed to write to MongoDB:`, error);
  }
}

const intervals: { [key: string]: number } = {
  app1: 61000,
  app2: 20000,
  app3: 15000,
  app4: 55000,
  app5: 8000,
  "default-app": 5000
};

async function main() {
  await initMongoDB();
  
  console.log(`Starting log simulator for ${APP_NAME}`);
  const interval = intervals[APP_NAME] || intervals["default-app"];
  
  setInterval(writeLog, interval);
}

main().catch(console.error);