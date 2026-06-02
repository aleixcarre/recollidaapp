// Aquest és el teu Service Worker bàsic per PWA
const CACHE_NAME = 'recollidapp-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Aquí pots afegir lògica de cache si vols que funcioni sense internet
});