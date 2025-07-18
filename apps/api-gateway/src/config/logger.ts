import winston from 'winston';

// Define log levels based on environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'production':
      return 'info';
    case 'staging':
      return 'warn';
    case 'development':
    default:
      return 'debug';
  }
};

// Fixed trace ID for now
export const FIXED_TRACE_ID = 'md72fcnsjkw6704xpc';

// Custom format following log4j pattern: "[%d] [%p] [%X{traceid}]%m%n"
const customFormat = winston.format.printf(({ timestamp, level, message, traceid, meta }) => {
  const traceId = traceid || FIXED_TRACE_ID;
  let formattedMessage = message;
  
  // If meta exists, format it appropriately
  if (meta && Object.keys(meta).length > 0) {
    const metaString = JSON.stringify(meta, null, 2);
    formattedMessage = `${message} ${metaString}`;
  }
  
  // Format: [%d] [%p] [%X{traceid}]%m%n
  return `[${timestamp}] [${level.toUpperCase()}] [${traceId}] ${formattedMessage}`;
});

// Console format with colorization that preserves our log4j pattern
const consoleFormat = winston.format.printf(({ timestamp, level, message, traceid, meta }) => {
  const traceId = traceid || FIXED_TRACE_ID;
  let formattedMessage = message;
  
  // If meta exists, format it appropriately
  if (meta && Object.keys(meta).length > 0) {
    const metaString = JSON.stringify(meta, null, 2);
    formattedMessage = `${message} ${metaString}`;
  }
  
  // Apply color to level only, preserving the log4j pattern
  const colorizer = winston.format.colorize();
  const coloredLevel = colorizer.colorize(level, level.toUpperCase());
  
  // Format: [%d] [%p] [%X{traceid}]%m%n
  return `[${timestamp}] [${coloredLevel}] [${traceId}] ${formattedMessage}`;
});

// Enumerate error format for better error handling
const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { 
      message: info.stack || info.message,
    });
  }
  return info;
});

// Create logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    enumerateErrorFormat(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    customFormat
  ),
  transports: [
    // Console transport for development
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        enumerateErrorFormat(),
        winston.format.errors({ stack: true }),
        consoleFormat
      )
    }),
    
    // File transport for production
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        handleExceptions: true,
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        format: customFormat
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        handleExceptions: true,
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        format: customFormat
      })
    ] : [])
  ],
  exitOnError: false
});

// Enhanced logger with trace ID support
class Logger {
  private baseLogger: winston.Logger;
  private defaultTraceId: string;

  constructor(baseLogger: winston.Logger, defaultTraceId: string) {
    this.baseLogger = baseLogger;
    this.defaultTraceId = defaultTraceId;
  }

  private log(level: string, message: string, traceId?: string, meta?: any): void {
    const logEntry: any = {
      level,
      message,
      traceid: traceId || this.defaultTraceId
    };

    // Include meta data if provided
    if (meta && Object.keys(meta).length > 0) {
      logEntry.meta = meta;
    }

    this.baseLogger.log(logEntry);
  }

  debug(message: string, traceId?: string): void {
    this.log('debug', message, traceId);
  }

  info(message: string, traceId?: string): void {
    this.log('info', message, traceId);
  }

  warn(message: string, traceId?: string): void {
    this.log('warn', message, traceId);
  }

  error(message: string, traceId?: string, meta?: any): void {
    this.log('error', message, traceId, meta);
  }

  // Method to create child logger with specific trace ID
  child(traceId: string): Logger {
    return new Logger(this.baseLogger, traceId);
  }

  // Method to log with specific trace ID without creating child logger
  withTraceId(traceId: string) {
    return {
      debug: (message: string) => this.debug(message, traceId),
      info: (message: string) => this.info(message, traceId),
      warn: (message: string) => this.warn(message, traceId),
      error: (message: string, meta?: any) => this.error(message, traceId, meta)
    };
  }
}

// Create enhanced logger instance
const enhancedLogger = new Logger(logger, FIXED_TRACE_ID);

export default enhancedLogger;