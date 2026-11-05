// AsiTube Service Worker
const CACHE_NAME = 'asi-tube-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle API and video requests directly
  if (event.request.url.includes('/api/') || event.request.url.includes('youtube') || event.request.url.includes('ytimg')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

