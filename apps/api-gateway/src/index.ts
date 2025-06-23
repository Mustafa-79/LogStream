import http from 'http'
import mongoose from 'mongoose'
import app from './app'
import config from './config/config'

const server = http.createServer(app)

const PORT = config.port

mongoose
  .connect(config.mongoose)
  .then(() => {
    console.log('Connected to Database')

    server.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Database connection failed:', error)
  })
