import Redis from 'ioredis';

let redis;
function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL;
    const opts = url?.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {};
    redis = new Redis(url, opts);
  }
  return redis;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function endpointKey(endpoint) {
  return 'sub:' + endpoint.slice(-48).replace(/[^a-zA-Z0-9]/g, '_');
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const r = getRedis();

  if (req.method === 'POST') {
    const { subscription, alarms } = req.body ?? {};
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'subscription inválida' });
    }
    await r.set(
      endpointKey(subscription.endpoint),
      JSON.stringify({ subscription, alarms: alarms ?? [], updatedAt: Date.now() })
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body ?? {};
    if (!endpoint) return res.status(400).json({ error: 'endpoint obrigatório' });
    await r.del(endpointKey(endpoint));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
