// FinanzApp Progressive Web App (PWA) Service Worker
const CACHE_NAME = 'finanzapp-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle standard network requests
  return;
});

