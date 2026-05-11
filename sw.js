const CACHE_NAME = 'studio-focus-v4';
// Arquivos que ficam em cache para uso offline
const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './chat-widget.css',
  './chat-widget.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // Ativa imediatamente sem esperar tabs antigas fecharem
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Remove caches de versões antigas
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => n !== CACHE_NAME && caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // index.html — network-first: sempre busca da rede, cache só se offline
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          // Atualiza o cache com a versão mais recente
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Demais assets — cache-first (fontes, imagens, etc.)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        // Só cacheia respostas válidas de mesma origem
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone()));
        }
        return res;
      });
    })
  );
});

// Alarmes agendados por setTimeout dentro do SW
// (funciona mesmo com a aba em background; o SW sobrevive por tempo limitado após o app fechar)
let _swAlarmTimeouts = [];

function showAlarmNotification(title, body, tag) {
  return self.registration.showNotification(title, {
    body, icon: './icon-192.png', badge: './icon-192.png',
    tag, renotify: true, vibrate: [200, 100, 200]
  });
}

function scheduleAlarmsInSW(alarms) {
  _swAlarmTimeouts.forEach(t => clearTimeout(t));
  _swAlarmTimeouts = [];

  const now = Date.now();

  alarms.forEach((alarm) => {
    const [h, m] = alarm.time.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target.getTime() <= now) target.setDate(target.getDate() + 1);

    const delay = target.getTime() - now;
    const t = setTimeout(() => {
      showAlarmNotification(alarm.title, alarm.body, alarm.tag);
    }, delay);
    _swAlarmTimeouts.push(t);
  });
}

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
