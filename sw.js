const CACHE_NAME = 'studio-focus-v5';
const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './chat-widget.css',
  './chat-widget.js'
];

const _SW_ALARMS_URL  = '/__sw_alarms__';
const _SW_FIRED_URL   = '/__sw_fired__';

let _swAlarmTimeouts = [];

// ── Notificação ──────────────────────────────────────────────────────────────
function showAlarmNotification(title, body, tag) {
  return self.registration.showNotification(title, {
    body,
    icon:     './icon-192.png',
    badge:    './icon-192.png',
    tag,
    renotify: true,
    vibrate:  [200, 100, 200]
  });
}

// ── Persistência via Cache API (sobrevive ao SW ser morto) ───────────────────
async function persistAlarms(alarms) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(_SW_ALARMS_URL, new Response(JSON.stringify(alarms), {
      headers: { 'Content-Type': 'application/json' }
    }));
  } catch(e) {}
}

async function loadPersistedAlarms() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const res   = await cache.match(_SW_ALARMS_URL);
    if (res) return res.json();
  } catch(e) {}
  return [];
}

// Rastreia quais alarmes já dispararam hoje (evita duplicatas após reinício do SW)
async function hasAlreadyFired(key) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const res   = await cache.match(_SW_FIRED_URL);
    const fired = res ? await res.json() : {};
    return !!fired[key];
  } catch(e) { return false; }
}

async function markFiredInCache(key) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const res   = await cache.match(_SW_FIRED_URL);
    let fired   = res ? await res.json() : {};

    // Limpa entradas de dias anteriores
    const today = new Date().toDateString();
    Object.keys(fired).forEach(k => { if (!k.startsWith(today)) delete fired[k]; });

    fired[key] = true;
    await cache.put(_SW_FIRED_URL, new Response(JSON.stringify(fired), {
      headers: { 'Content-Type': 'application/json' }
    }));
  } catch(e) {}
}

// ── Verifica e dispara alarmes no horário exato ──────────────────────────────
async function checkAndFireAlarms(alarms) {
  const now     = new Date();
  const hh      = String(now.getHours()).padStart(2, '0');
  const mm      = String(now.getMinutes()).padStart(2, '0');
  const timeStr = hh + ':' + mm;
  const today   = now.toDateString();

  for (const alarm of alarms) {
    if (alarm.time !== timeStr) continue;
    const k = today + '|' + alarm.tag + '|' + alarm.time;
    if (await hasAlreadyFired(k)) continue;
    await markFiredInCache(k);
    await showAlarmNotification(alarm.title, alarm.body, alarm.tag);
  }
}

// ── Agenda alarmes via setTimeout + persiste para sobreviver a reinicios ─────
function scheduleAlarmsInSW(alarms) {
  _swAlarmTimeouts.forEach(t => clearTimeout(t));
  _swAlarmTimeouts = [];

  const now = Date.now();

  alarms.forEach((alarm) => {
    const [h, m] = alarm.time.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    // Se o horário já passou hoje, agenda para amanhã
    if (target.getTime() <= now) target.setDate(target.getDate() + 1);

    const delay = target.getTime() - now;
    const t = setTimeout(() => {
      showAlarmNotification(alarm.title, alarm.body, alarm.tag);
    }, delay);
    _swAlarmTimeouts.push(t);
  });

  // Persiste para que o próximo activate possa recarregar
  persistAlarms(alarms);
}

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: limpa caches velhos e RESTAURA alarmes persistidos ─────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(names
          .filter(n => n !== CACHE_NAME)
          .map(n => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
      .then(() => loadPersistedAlarms())
      .then((alarms) => {
        if (alarms && alarms.length) scheduleAlarmsInSW(alarms);
      })
  );
});

// ── Fetch (network-first para index.html, cache-first para assets) ───────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora URLs internas usadas para persistência
  if (url.pathname === _SW_ALARMS_URL || url.pathname === _SW_FIRED_URL) return;

  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone()));
        }
        return res;
      });
    })
  );
});

// ── Mensagens da página ──────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      showAlarmNotification(
        event.data.title,
        event.data.body,
        event.data.tag || 'supplement-alarm'
      )
    );
  }

  if (event.data.type === 'SCHEDULE_ALARMS') {
    scheduleAlarmsInSW(event.data.alarms || []);
  }
});

// ── Push do servidor (Web Push API) ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Studio Focus', body: 'Lembrete de suplemento!', tag: 'alarm', icon: './icon-192.png' };
  try { data = { ...data, ...event.data.json() }; } catch(e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:     data.body,
      icon:     data.icon || './icon-192.png',
      badge:    './icon-192.png',
      tag:      data.tag || 'alarm',
      renotify: true,
      vibrate:  [200, 100, 200],
    })
  );
});

// ── Periodic Background Sync (Chrome/Android) ────────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-alarms') {
    event.waitUntil(
      loadPersistedAlarms().then(alarms => checkAndFireAlarms(alarms))
    );
  }
});

// ── Notificação clicada: abre o app ──────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const appClient = clients.find(c => c.url && c.visibilityState !== 'hidden');
        if (appClient) return appClient.focus();
        return self.clients.openWindow('./');
      })
  );
});
