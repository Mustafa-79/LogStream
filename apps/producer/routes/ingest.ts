import express from 'express';
import { queueLogs } from '../services/logService';

const router = express.Router();

router.post('/ingest', async (req, res) => {
  try {
    const logs = req.body;
    await queueLogs(logs);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error queuing logs:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
