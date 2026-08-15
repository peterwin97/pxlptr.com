const CACHE = 'lens-throw-v1';
const ASSETS = [
  '/tools/lens-throw/',
  '/tools/lens-throw/index.html',
  '/tools/lens-throw/lens-data.js',
  '/tools/lens-throw/manifest.json',
  '/tools/lens-throw/icons/icon-192.png',
  '/tools/lens-throw/icons/icon-512.png',
];

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
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
