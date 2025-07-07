import http from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import app from './app'
import config from './config/config'
import { LogMonitorService } from './services/logMonitorService'

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ["GET", "POST"]
  }
})

const PORT = config.port

let logMonitorService: LogMonitorService;

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  if (logMonitorService) {
    logMonitorService.handleClientConnection(socket);
  }

  socket.on('startLogMonitoring', () => {
    console.log(`Client ${socket.id} requested to start log monitoring`);
    socket.join('logMonitoring');
  });

  socket.on('stopLogMonitoring', () => {
    console.log(`Client ${socket.id} requested to stop log monitoring`);
    socket.leave('logMonitoring');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

app.set('io', io)

mongoose
  .connect(config.mongoose)
  .then(() => {
    console.log('Connected to Database')

    server.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`)
      console.log(`WebSocket server is ready`)
      
      logMonitorService = new LogMonitorService(io);
      logMonitorService.start();
    })
  })
  .catch((error) => {
    console.error('Database connection failed:', error)
  })

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  
  if (logMonitorService) {
    logMonitorService.stop();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  
  if (logMonitorService) {
    logMonitorService.stop();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io }