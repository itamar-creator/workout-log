const CACHE = 'workout-log-v17';

// Core files the app genuinely can't run without.
const CORE_ASSETS = [
  './', './index.html', './manifest.json',
  'vendor/xlsx.full.min.js'
];

// Nice-to-have files. If any of these are missing (e.g. not yet uploaded),
// caching must NOT fail — see the install handler below.
const OPTIONAL_ASSETS = [
  'icons/icon-192.png', 'icons/icon-512.png',
  'icons/bicep_curl.png', 'icons/chest_together.png', 'icons/dumbbell_back_pull.png',
  'icons/dumbbell_chest_press.png', 'icons/leg_extension.png', 'icons/open_chest_fly.png',
  'icons/overhead_press.png', 'icons/pullup.png', 'icons/rear_delt_fly.png', 'icons/squat.png',
  'icons/placeholder.png',
  'sounds/button-press.mp3',
  'sounds/reward/reward-1.mp3', 'sounds/reward/reward-2.mp3', 'sounds/reward/reward-3.mp3',
  'sounds/reward/reward-4.mp3', 'sounds/reward/reward-5.mp3', 'sounds/reward/reward-6.mp3'
];

// Cache each file independently. cache.addAll() is all-or-nothing: a single
// missing file rejects the whole install, the new worker never activates,
// and the browser silently keeps serving the OLD version forever. Caching
// one at a time and swallowing individual failures means a missing sound or
// icon can never block an update from landing.
async function cacheIndividually(cache, urls) {
  await Promise.all(urls.map(async url => {
    try {
      const res = await fetch(url, { cache: 'reload' });
      if (res.ok) await cache.put(url, res);
      else console.warn('[sw] skipped (not ok):', url, res.status);
    } catch (err) {
      console.warn('[sw] skipped (failed):', url, err);
    }
  }));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cacheIndividually(cache, CORE_ASSETS);
    await cacheIndividually(cache, OPTIONAL_ASSETS);
  })());
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

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only our own GET requests. POSTs (the backup API) can't be cached at
  // all — the Cache API only supports GET — and cross-origin was never
  // meant to be cached here.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  const isDocument = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isDocument) {
    // Network-first for the app itself, so a new version appears on the
    // very next load rather than the one after. Falls back to cache offline.
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      }
    })());
    return;
  }

  // Static assets: serve from cache instantly, refresh in the background.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
