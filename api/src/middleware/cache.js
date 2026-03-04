// api/src/middleware/cache.js
const redisClient = require('../redis');

const cacheMiddleware = (key, ttlSeconds = 60) => {
  return async (req, res, next) => {
    // 1. Graceful Fallback: Skip if Redis is disconnected
    if (!redisClient.isReady) {
      return next();
    }

    try {
      // 2. Cache Hit: Return data and end request
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        console.log(`Serving [${key}] from Redis cache`);
        return res.json(JSON.parse(cachedData));
      }

      // 3. Cache Miss: Intercept the response
      // Save the original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json temporarily
      res.json = (body) => {
        // Automatically save to Redis in the background
        if (redisClient.isReady) {
          redisClient.setEx(key, ttlSeconds, JSON.stringify(body))
            .catch(err => console.error('Cache write error:', err));
        }
        
        // Finally, send the data to the user using the original function
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue to database gracefully on error
    }
  };
};

module.exports = cacheMiddleware;
