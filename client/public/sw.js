const CACHE_NAME = 'capyvo-offline-v1'
const OFFLINE_URL = '/offline.html'

// Files to pre-cache on install
const PRECACHE_URLS = [OFFLINE_URL, '/offline-image.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)))
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Remove old caches
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Always serve pre-cached assets from cache (image, offline page itself)
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)))
    return
  }

  // For navigation requests: fall back to offline page when network fails
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
      ),
    )
  }
})
