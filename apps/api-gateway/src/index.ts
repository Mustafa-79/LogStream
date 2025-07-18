import http from 'http'
import mongoose from 'mongoose'
import app from './app'
import config from './config/config'
import { googleDirectoryService } from './services/googleDirectoryService'
import { startAgenda } from './config/agenda';
import { monitoringService } from './services/monitoringService'
import { logRetentionService } from './services/dataRetentionService'
import logger from './config/logger'

// Debug loggers for different components
const startupDebugger = logger.withTraceId('STARTUP')
const dbDebugger = logger.withTraceId('DATABASE')
const serviceDebugger = logger.withTraceId('SERVICE')

const server = http.createServer(app)

const PORT = config.port

mongoose
  .connect(config.mongoose)
  .then(async () => {
    dbDebugger.info('Connected to Database')

    await logRetentionService.initializeLogRetention();
    await startAgenda();

    monitoringService.start();
    serviceDebugger.info('✅ Monitoring service started');

    startupDebugger.info('Initializing Google Directory service...')
    googleDirectoryService
      .testConnection()
      .then((result) => {
        if (result.success) {
          serviceDebugger.info('✅ Google Directory service initialized successfully')
        } else {
          serviceDebugger.warn(`⚠️ Google Directory service initialization failed: ${result.message}`)
        }
      })
      .catch((error) => {
        serviceDebugger.error('❌ Google Directory service test failed:', error)
      })

    server.listen(PORT, () => {
      startupDebugger.info(`Server is listening on port ${PORT}`)
    })
  })
  .catch((error) => {
    dbDebugger.error('Database connection failed:', error)
  })