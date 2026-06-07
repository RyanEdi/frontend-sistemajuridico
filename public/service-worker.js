const CACHE_NAME = 'legaltech-pcd-cache-v2';
const OFFLINE_URLS = ['/', '/dashboard'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            JSON.stringify({ error: 'Offline. Dados não disponíveis.' }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
            },
          ),
      ),
    );
    return;
  }

  const isGet = request.method === 'GET';
  const isSameOrigin = new URL(request.url).origin === self.location.origin;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/') || caches.match('/dashboard')),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isGet && isSameOrigin && response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});