import http from 'http'
import mongoose from 'mongoose'
import app from './app'
import config from './config/config'
import { googleDirectoryService } from './services/googleDirectoryService'

const server = http.createServer(app)

const PORT = config.port

mongoose
  .connect(config.mongoose)
  .then(() => {
    console.log('Connected to Database')

    // Initialize Google Directory service
    console.log('Initializing Google Directory service...')
    // The service is already initialized in its constructor, but we can test the connection
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
    })
  })
  .catch((error) => {
    console.error('Database connection failed:', error)
  })
