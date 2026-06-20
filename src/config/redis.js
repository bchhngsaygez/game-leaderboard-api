const Redis = require('ioredis');

let errorLogged = false;

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 500, 5000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
  errorLogged = false;
});

redis.on('error', (err) => {
  if (!errorLogged) {
    console.error('❌ Redis connection error:', err.message);
    console.error('   Make sure Redis server is running. Retrying in background...');
    errorLogged = true;
  }
});

module.exports = redis;
