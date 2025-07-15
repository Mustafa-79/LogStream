import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Alert schema (should match consumer's Alert model)
const alertSchema = new mongoose.Schema({
  appId: String,
  errorCount: Number,
  threshold: Number,
  period: Number,
  timestamp: Date,
  resolved: { type: Boolean, default: false }
});

const Alert = mongoose.model('Alert', alertSchema);

// Get all alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alerts for specific app
router.get('/alerts/:appId', async (req, res) => {
  try {
    const alerts = await Alert.find({ appId: req.params.appId }).sort({ timestamp: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Mark alert as resolved
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    );
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

export default router;
