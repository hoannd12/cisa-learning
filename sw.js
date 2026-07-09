// Service Worker for offline support
const CACHE_NAME = 'cisa-learn-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/components.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
