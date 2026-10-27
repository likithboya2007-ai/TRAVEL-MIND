const CACHE_NAME = 'travelmind-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  if (event.request.url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open('map-tiles').then(cache =>
        cache.match(event.request).then(response =>
          response || fetch(event.request).then(res => {
            cache.put(event.request, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== 'map-tiles')
          .map(key => caches.delete(key))
      )
    )
  );
});
