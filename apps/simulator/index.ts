import * as fs from "fs";
import * as path from "path";

// Configuration from environment variables
const APP_NAME = process.env.APP_NAME || "default-app";
// const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// Log levels
const levels: string[] = ["DEBUG", "INFO", "ERROR", "TRACE"];

// App-specific log messages
const appMessages: { [key: string]: string[] } = {
  app1: [
    "User authentication successful",
    "Database connection established",
    "Processing payment transaction",
    "Cache hit for user preferences",
    "API request received"
  ],
  app2: [
    "File upload completed",
    "Email notification sent",
    "Background job started",
    "Configuration updated",
    "Health check passed"
  ],
  app3: [
    "Order processing initiated",
    "Inventory updated",
    "Shipping label generated",
    "Customer notification sent",
    "Analytics event tracked"
  ],
  "default-app": [
    "Generic application log message",
    "System operation completed",
    "Process executed successfully"
  ]
};

// Log file path
const logPath: string = path.join(__dirname, "logs", "app.log");

// Ensure logs directory exists
fs.mkdirSync(path.dirname(logPath), { recursive: true });

// Overwrite the existing log file (if any)
fs.writeFileSync(logPath, '');

console.log(`Starting log simulator for ${APP_NAME}`);

// Simple unique identifier generator
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

function getRandomMessage(): string {
  const messages = appMessages[APP_NAME] || appMessages["default-app"];
  return messages[Math.floor(Math.random() * messages.length)];
}

function generateLog(): string {
  const level: string = levels[Math.floor(Math.random() * levels.length)];
  const traceId: string = generateId();
  const message: string = getRandomMessage();
  const requestId: string = generateId();
  
  return `[${getCurrentTimestamp()}] [${level}] [${traceId}] [${APP_NAME}] [${requestId}] ${message}\n`;
}

function writeLog(): void {
  const logEntry: string = generateLog();
  fs.appendFileSync(logPath, logEntry);
  console.log(`[${APP_NAME}] Log written:`, logEntry.trim());
}

// Write logs at different intervals for each app to simulate real-world scenarios
const intervals: { [key: string]: number } = {
  app1: 3000,  // Every 3 seconds (high traffic app)
  app2: 7000,  // Every 7 seconds (medium traffic app)
  app3: 5000,  // Every 5 seconds (regular traffic app)
  "default-app": 5000
};

const interval = intervals[APP_NAME] || intervals["default-app"];
console.log(`Writing logs every ${interval}ms for ${APP_NAME}`);

// Write a log at specified intervals
setInterval(writeLog, interval);