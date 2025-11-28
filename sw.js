const CACHE_NAME = 'ornare-cache-v2';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  // Força o SW a ativar imediatamente, sem esperar abas fecharem
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  // Assume o controle de todas as abas abertas imediatamente
  event.waitUntil(self.clients.claim());

  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Estratégia Stale-While-Revalidate para garantir atualização rápida mas funcionamento offline
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then(
          (networkResponse) => {
            // Não cacheia requisições externas (API, Firebase, etc) ou POSTs
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(() => {
           // Fallback se estiver offline e sem cache
        });
        return cachedResponse || fetchPromise;
      })
  );
});