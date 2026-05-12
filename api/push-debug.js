import Redis from 'ioredis';

export default async function handler(req, res) {
  const url = process.env.REDIS_URL || '';
  let redisOk = false;
  let redisError = null;

  try {
    const isTLS = url.startsWith('rediss://');
    const r = new Redis(url, isTLS ? { tls: { rejectUnauthorized: false } } : {});
    await r.ping();
    redisOk = true;
    r.disconnect();
  } catch (e) {
    redisError = e.message;
  }

  res.status(200).json({
    hasRedisUrl:    !!url,
    redisUrlPrefix: url.slice(0, 25) + '...',
    redisOk,
    redisError,
    hasVapidPub:    !!process.env.VAPID_PUBLIC_KEY,
    hasVapidPriv:   !!process.env.VAPID_PRIVATE_KEY,
  });
}
