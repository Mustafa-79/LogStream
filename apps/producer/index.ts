import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { initRedis } from './config/redis';
import ingestRoute from './routes/ingest';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

app.use(bodyParser.json({ limit: '1mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'producer',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/', ingestRoute);


// Start server
async function start() {
  await initRedis();

  // using 0.0.0.0 allows the server to be accessible from any network interface
  app.listen(port, '0.0.0.0', () => {
  console.log(`Log producer server listening at http://0.0.0.0:${port}`);
});

}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
