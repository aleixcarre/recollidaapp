// public/sw.js
self.addEventListener('install', () => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('fetch', (event) => {
    // Deixem que les sol·licituds passin de llarg de forma normal
    return;
  });