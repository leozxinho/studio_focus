const CACHE_NAME = 'studio-focus-v3';
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(event.data.title, {
        body: event.data.body,
        vibrate: [200, 100, 200],
        tag: 'supplement-alarm',
        renotify: true
      })
    );
  }
});
