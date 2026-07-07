const CACHE = 'workout-log-v4';
const ASSETS = [
  './', './index.html', './manifest.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png',
  'icons/bicep_curl.png', 'icons/chest_together.png', 'icons/dumbbell_back_pull.png',
  'icons/dumbbell_chest_press.png', 'icons/leg_extension.png', 'icons/open_chest_fly.png',
  'icons/overhead_press.png', 'icons/pullup.png', 'icons/rear_delt_fly.png', 'icons/squat.png',
  'icons/placeholder.png',
  'vendor/xlsx.full.min.js',
  'sounds/button-press.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate: serve cached content instantly, but always
// fetch a fresh copy in the background and update the cache for next time.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => cachedResponse);
        return cachedResponse || fetchPromise;
      })
    )
  );
});
