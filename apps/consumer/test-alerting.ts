import { alertingService } from './alertingService';
import { Alert } from './models/Alert';
import mongoose from 'mongoose';

// Test the alerting system
async function testAlerting() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/logstream');
    console.log('Connected to MongoDB');

    // Clear any existing alerts for testing
    await Alert.deleteMany({ appId: 'app1' });
    console.log('Cleared existing alerts for app1');

    // Simulate multiple ERROR logs for app1
    console.log('Simulating 12 ERROR logs for app1...');
    for (let i = 0; i < 12; i++) {
      await alertingService.checkAndAlert('app1', 'ERROR');
      console.log(`Processed error ${i + 1}/12`);
    }

    // Check if alert was created
    const alerts = await Alert.find({ appId: 'app1' });
    console.log(`Found ${alerts.length} alerts for app1`);
    
    if (alerts.length > 0) {
      console.log('Alert details:', alerts[0]);
      console.log('✅ Alerting system works correctly!');
    } else {
      console.log('❌ No alerts generated');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAlerting();
