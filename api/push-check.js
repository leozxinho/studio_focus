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

/**
 * Gera os horários da janela de tolerância (minuto atual ± 1).
 * Isso garante que alarmes não sejam perdidos se o cron externo
 * executar 30-60s antes ou depois do minuto exato.
 */
function getTimeWindow(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const times = new Set();
  times.add(timeStr); // minuto exato

  // minuto anterior
  const prev = new Date(2000, 0, 1, h, m - 1);
  times.add(
    String(prev.getHours()).padStart(2, '0') + ':' +
    String(prev.getMinutes()).padStart(2, '0')
  );

  // minuto seguinte
  const next = new Date(2000, 0, 1, h, m + 1);
  times.add(
    String(next.getHours()).padStart(2, '0') + ':' +
    String(next.getMinutes()).padStart(2, '0')
  );

  return times;
}

/**
 * Chave de deduplicação: impede que o mesmo alarme dispare
 * mais de uma vez no mesmo minuto (tolerância incluída).
 * Expira em 5 minutos no Redis.
 */
function firedKey(endpoint, tag, time) {
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const epHash = endpoint.slice(-24).replace(/[^a-zA-Z0-9]/g, '_');
  return `fired:${today}:${epHash}:${tag}:${time}`;
}

export default async function handler(req, res) {
  // Autenticação: aceita secret via query param OU via header Authorization
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const fromQuery  = req.query?.secret;
    const fromHeader = (req.headers?.authorization || '').replace('Bearer ', '');
    if (fromQuery !== secret && fromHeader !== secret) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
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
  const timeWindow = getTimeWindow(timeStr);

  console.log(`[push-check] Hora Brasília: ${timeStr} | Janela: [${[...timeWindow].join(', ')}]`);

  const r = getRedis();
  const keys = await r.keys('sub:*');
  if (!keys.length) {
    console.log('[push-check] Nenhuma subscription encontrada no Redis.');
    return res.status(200).json({ sent: 0, time: timeStr, subscriptions: 0 });
  }

  console.log(`[push-check] ${keys.length} subscription(s) no Redis.`);

  const rawRecords = await Promise.all(keys.map(k => r.get(k)));
  const records = rawRecords.map(raw => { try { return JSON.parse(raw); } catch { return null; } });

  let sent = 0;
  let errors = 0;

  await Promise.all(records.map(async (record) => {
    if (!record?.subscription || !Array.isArray(record.alarms)) return;

    // Verifica alarmes cujo horário cai dentro da janela de tolerância
    const due = record.alarms.filter(a => timeWindow.has(a.time));
    if (!due.length) return;

    for (const alarm of due) {
      // Deduplicação via Redis (TTL de 5 min)
      const fk = firedKey(record.subscription.endpoint, alarm.tag || 'alarm', alarm.time);
      const already = await r.get(fk);
      if (already) {
        console.log(`[push-check] Já disparado: ${alarm.tag} ${alarm.time} — skip`);
        continue;
      }

      try {
        await webpush.sendNotification(
          record.subscription,
          JSON.stringify({
            title: alarm.title,
            body: alarm.body,
            tag: alarm.tag || 'alarm',
            icon: '/icon-192.png'
          })
        );
        // Marca como disparado com TTL de 300s (5 min)
        await r.set(fk, '1', 'EX', 300);
        sent++;
        console.log(`[push-check] ✅ Push enviado: ${alarm.title} (${alarm.time})`);
      } catch (err) {
        errors++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await r.del(endpointKey(record.subscription.endpoint));
          console.log(`[push-check] 🗑️ Subscription expirada removida (${err.statusCode})`);
        }
        console.error('[push-check] ❌ Erro push:', err.statusCode, err.message);
      }
    }
  }));

  console.log(`[push-check] Resultado: ${sent} enviado(s), ${errors} erro(s).`);
  return res.status(200).json({ ok: true, time: timeStr, sent, errors, subscriptions: keys.length });
}
