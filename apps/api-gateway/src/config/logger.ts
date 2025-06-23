import winston from 'winston'

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack })
  }
  return info
})

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  http: 'magenta',
  debug: 'gray'
})

const logger = winston.createLogger({
  level: 'debug',
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.colorize({ all: true }),
    winston.format.splat(),
    winston.format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error']
    })
  ]
})

export default logger
