const cacheName = 'petronia-web-v2';
const files = [
  './', './index.html', './manifest.json', './css/game-v2.css', './css/ui-v2.css', './js/game-v2.js',
  './assets/portada.jpg', './assets/portada-social.jpg', './assets/icon_192.png', './assets/icon_512.png',
  './assets/sprites/petronia_celebrate.png', './assets/sprites/petronia_front.png',
  './assets/sprites/petronia_side.png', './assets/sprites/petronia_three_quarter.png',
  './assets/sprites/petronia_walk_strip.png'
];

const base = self.registration.scope;
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName)
    .then((cache) => cache.addAll(files.map((path) => new Request(new URL(path, base), { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith('petronia-web-') && key !== cacheName)
    .map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

const localFiles = new Set(files.map((path) => new URL(path, base).href));
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  url.search = '';
  if (!localFiles.has(url.href)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-cache' }).catch(() => caches.match(url.href)));
    return;
  }
  event.respondWith(caches.match(url.href).then((cached) => cached || fetch(request)));
});
