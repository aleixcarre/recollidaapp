// Aquest esdeveniment permet que el navegador consideri l'app com a PWA
self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
  });
  
  // Aquest FETCH handler és el correcte: 
  // Si no vols fer estratègies offline complexes, 
  // simplement deixa que les peticions passin per la xarxa.
  self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
  });