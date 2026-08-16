/* IBI Fashion Jewellery — service worker
   Bump CACHE on every release so a stale copy never outlives a deploy. */
const CACHE = 'ibi-fashion-jewellery-v2.7';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  // cache:'reload' — a plain addAll() goes through the HTTP cache, so a version
  // bump can quietly precache the OLD page under the NEW cache name.
  e.waitUntil(caches.open(CACHE).then(c =>
    c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const u = e.request.url;
  // The laptop server's API and product photos must never come from a cache,
  // or a stale stock figure could outlive a sale.
  if (e.request.method !== 'GET' ||
      u.includes('/api') ||
      u.includes('/images/') ||
      u.includes('fonts.googleapis.com') ||
      u.includes('fonts.gstatic.com')) {
    return;
  }
  // Network-first, so a fresh push is served even at the same version.
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
