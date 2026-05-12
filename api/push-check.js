import webpush from 'web-push';
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

webpush.setVapidDetails(
  process.env.VAPID_CONTACT || 'mailto:contato@studiofocus.com.br',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function endpointKey(endpoint) {
  return 'sub:' + endpoint.slice(-48).replace(/[^a-zA-Z0-9]/g, '_');
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Horário em Brasília (UTC-3)
  const now = new Date();
  const options = {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  const timeStr = new Intl.DateTimeFormat('pt-BR', options).format(now).replace('h', ':').trim();
  
  console.log(`[push-check] Checking alarms for ${timeStr} (Brasília)`);

  const r = getRedis();
  const keys = await r.keys('sub:*');
  if (!keys.length) return res.status(200).json({ sent: 0, time: timeStr });

  const rawRecords = await Promise.all(keys.map(k => r.get(k)));
  const records = rawRecords.map(raw => { try { return JSON.parse(raw); } catch { return null; } });

  let sent = 0;

  await Promise.all(records.map(async (record) => {
    if (!record?.subscription || !Array.isArray(record.alarms)) return;

    const due = record.alarms.filter(a => a.time === timeStr);
    if (!due.length) return;

    for (const alarm of due) {
      try {
        await webpush.sendNotification(
          record.subscription,
          JSON.stringify({ title: alarm.title, body: alarm.body, tag: alarm.tag || 'alarm', icon: '/icon-192.png' })
        );
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await r.del(endpointKey(record.subscription.endpoint));
        }
        console.error('push-check error:', err.statusCode, err.message);
      }
    }
  }));

  return res.status(200).json({ ok: true, time: timeStr, sent });
}
