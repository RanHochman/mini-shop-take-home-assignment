// api/src/redis.js
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://cache:6379'
});

// CRITICAL: This error listener prevents Node from crashing if Redis drops
redisClient.on('error', (err) => console.warn('Redis error:', err.message));

// Connect asynchronously without blocking the rest of the API
(async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis cache');
  } catch (error) {
    console.warn('Initial Redis connection failed, running in DB fallback mode.');
  }
})();

module.exports = redisClient;
