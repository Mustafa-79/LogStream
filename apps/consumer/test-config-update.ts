import Redis from 'ioredis';

// Test config update via Redis pub/sub
const testConfigUpdate = async () => {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379')
  });

  // Test config update
  const configUpdate = {
    appId: 'app1',
    config: {
      threshold: 5,  // Lower threshold for testing
      period: 2,     // 2 minutes
      cooldown: 5    // 5 minutes
    }
  };

  await redis.publish('config-updates', JSON.stringify(configUpdate));
  console.log('Published config update:', configUpdate);

  redis.disconnect();
};

// Run test
testConfigUpdate().catch(console.error);
