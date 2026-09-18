const CACHE_NAME = 'banimal-v4';
const STATIC_CACHE = ['/', '/manifest.json'];
const MAX_CACHE_ENTRIES = 60;        // cap dynamic cache entries
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days TTL

// Evict oldest entries once limit is reached
async function trimCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_ENTRIES) {
    await cache.delete(keys[0]);
    await trimCache(cacheName);
  }
}

// Check if a cached response is still fresh
function isFresh(response) {
  if (!response) return false;
  const date = response.headers.get('date');
  if (!date) return true; // no date header — assume fresh
  return Date.now() - new Date(date).getTime() < MAX_AGE_MS;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Skip API calls and cross-origin requests
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);

      // Return fresh cached response immediately (cache-first for static)
      if (cached && isFresh(cached)) return cached;

      try {
        const response = await fetch(event.request);
        if (response.ok) {
          cache.put(event.request, response.clone());
          trimCache(CACHE_NAME); // async — don't block response
        }
        return response;
      } catch {
        // Network failed — serve stale cache if available
        return cached || Response.error();
      }
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Banimal', {
      body: data.body || '',
      icon: 'https://banimal.co.za/icon-192.png',
      badge: 'https://banimal.co.za/favicon-32.png',
      image: data.image || '',
      data: { url: data.url || '/' },
      actions: data.actions || [],
      requireInteraction: false,
      silent: false,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      return clients.openWindow?.(targetUrl);
    })
  );
});
