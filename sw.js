/* IBI Fashion Jewellery — service worker
   Bump CACHE on every release so a stale copy never outlives a deploy. */
const CACHE = 'ibi-fashion-jewellery-v1.0';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
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
  if (u.includes('script.google.com') ||
      u.includes('googleusercontent.com') ||
      u.includes('drive.google.com') ||
      u.includes('fonts.googleapis.com') ||
      u.includes('fonts.gstatic.com')) {
    return; // always live: backend, Drive images, fonts
  }
  // Network-first, so a fresh push is served even at the same version.
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
