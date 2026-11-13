const CACHE_NAME = 'aurix-v2';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual add() calls to be more resilient than addAll()
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(asset => 
          cache.add(asset).catch(err => console.warn(`⚠️ SW: Failed to cache ${asset}:`, err))
        )
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Do not intercept API requests or cross-origin backend calls
  if (url.origin === self.location.origin && !url.pathname.includes('/aurixwebapi') && !url.pathname.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch(() => new Response("Network error", { status: 408 }));
      })
    );
  }
});
