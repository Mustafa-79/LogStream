import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { initRedis } from './config/redis';
import ingestRoute from './routes/ingest';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json({ limit: '1mb' }));

// Routes
app.use('/', ingestRoute);


// Start server
async function start() {
  await initRedis();

  app.listen(port, () => {
    console.log(`Log producer server listening at http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
