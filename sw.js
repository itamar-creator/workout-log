const CACHE = 'workout-log-v2';
const ASSETS = [
  './', './index.html', './manifest.json',
  'icons/icon-192.png', 'icons/icon-512.png',
  'icons/bicep_curl.png', 'icons/chest_together.png', 'icons/dumbbell_back_pull.png',
  'icons/dumbbell_chest_press.png', 'icons/leg_extension.png', 'icons/open_chest_fly.png',
  'icons/overhead_press.png', 'icons/pullup.png', 'icons/rear_delt_fly.png', 'icons/squat.png',
  'sounds/fireworks.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => { self.clients.claim(); });
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
