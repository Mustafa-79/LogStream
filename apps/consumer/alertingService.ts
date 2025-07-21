import Redis from 'ioredis';
import { Alert } from './models/Alert';
import { getConfig } from './configManager';

const COOLDOWN = 10 * 60 * 1000; // 10 minutes

class AlertingService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });

    // Test Redis connection
    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
      // Clear error ZSETs asynchronously without blocking the connect event
      this.clearErrorZSets().catch(error => {
        console.error('❌ Failed to clear error ZSETs on startup:', error);
      });
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });
  }

  private async clearErrorZSets() {
    try {
      console.log('🧹 Clearing error ZSETs on startup...');
      
      // Find all keys that match the pattern "errors:*"
      const errorKeys = await this.redis.keys('errors:*');
      
      if (errorKeys.length > 0) {
        console.log(`Found ${errorKeys.length} error ZSETs to clear:`, errorKeys);
        
        // Delete all error ZSETs
        await this.redis.del(...errorKeys);
        
        console.log('✅ All error ZSETs cleared successfully');
      } else {
        console.log('No error ZSETs found to clear');
      }
    } catch (error) {
      console.error('❌ Error clearing ZSETs:', error);
    }
  }

  async checkAndAlert(appId: string, logLevel: string) {
    try {
      if (logLevel !== 'ERROR') return;

      const config = getConfig(appId);
      if (!config) {
        console.log(`No config found for ${appId}`);
        return;
      }
      
      // Check if alerting is enabled
      if (!config.notificationsEnabled) {
        console.log(`Alerting is disabled for ${appId}`);
        return;
      }

      const now = Date.now();
      const periodMs = config.period * 60 * 1000;

      // Add error to ZSET
      await this.redis.zadd(`errors:${appId}`, now, `${now}-${Math.random()}`);

      // Remove old entries
      await this.redis.zremrangebyscore(`errors:${appId}`, 0, now - periodMs);

      // Count current errors
      const errorCount = await this.redis.zcard(`errors:${appId}`);


      if (errorCount >= config.threshold) {
        // Check cooldown
        const lastAlert = await this.redis.get(`lastAlert:${appId}`);
        if (!lastAlert || (now - parseInt(lastAlert)) > COOLDOWN) {
          // Set cooldown
          await this.redis.set(`lastAlert:${appId}`, now);
          
          // Save alert to MongoDB
          await Alert.create({
            appId,
            errorCount,
            threshold: config.threshold,
            period: config.period,
            timestamp: new Date()
          });

          console.log(`🚨 Alert saved for ${appId}: ${errorCount} errors in ${config.period} minutes`);
        } else {
          console.log(`⏳ Alert for ${appId} is in cooldown period`);
        }
      } else {
        console.log(`Threshold not reached for ${appId} (${errorCount}/${config.threshold}) | Period: ${config.period} minutes`);
      }
    } catch (error) {
      console.error(`Error in checkAndAlert for ${appId}:`, error);
    }
  }
}

export const alertingService = new AlertingService();
