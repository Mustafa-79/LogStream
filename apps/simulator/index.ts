import * as fs from "fs";
import * as path from "path";

// Log levels
const levels: string[] = ["DEBUG", "INFO", "ERROR", "TRACE"];

// Log file path
const logPath: string = path.join(__dirname, "logs", "app.log");

// Ensure logs directory exists
fs.mkdirSync(path.dirname(logPath), { recursive: true });

// Overwrite the existing log file (if any)
fs.writeFileSync(logPath, '');

// Simple unique identifier generator
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

function generateLog(): string {
  const level: string = levels[Math.floor(Math.random() * levels.length)];
  const traceId: string = generateId();
  const message: string = `This is a ${level} log message`;
  return `[${getCurrentTimestamp()}] [${level}] [${traceId}] ${message}\n`;
}

function writeLog(): void {
  const logEntry: string = generateLog();
  fs.appendFileSync(logPath, logEntry);
  console.log("Log written:", logEntry.trim());
}

// Write a log every 5 seconds
setInterval(writeLog, 5000);