import http from 'http'
import mongoose from 'mongoose'
import app from './app'
import config from './config/config'
import { googleDirectoryService } from './services/googleDirectoryService'
import { startAgenda } from './config/agenda';
import { monitoringService } from './services/monitoringService'

const server = http.createServer(app)

const PORT = config.port

mongoose
  .connect(config.mongoose)
  .then(async () => {
    console.log('Connected to Database')

    await startAgenda();

    monitoringService.start();
    console.log('✅ Monitoring service started');

    console.log('Initializing Google Directory service...')
    googleDirectoryService
      .testConnection()
      .then((result) => {
        if (result.success) {
          console.log('✅ Google Directory service initialized successfully')
        } else {
          console.warn('⚠️ Google Directory service initialization failed:', result.message)
        }
      })
      .catch((error) => {
        console.error('❌ Google Directory service test failed:', error)
      })

    server.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`)
      console.log(`WebSocket server is ready`)
    })
  })
  .catch((error) => {
    console.error('Database connection failed:', error)
  })