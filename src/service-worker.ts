/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'quran-reader-v1';

// Assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/quran_metadata.json',
  '/quran_simple_clean.json',
  '/quran_highlight_data.json',
  '/muyasar.json',
  '/surahs.json'
];

// Function to cache all page images (003.png to 851.png)
const cachePageImages = async (cache: Cache) => {
  const pageUrls = [];
  for (let i = 3; i <= 851; i++) {
    const pageNumber = i.toString().padStart(3, '0');
    pageUrls.push(`/new_pages/${pageNumber}.png`);
  }

  // Cache images in smaller chunks to avoid memory issues
  const CHUNK_SIZE = 20;
  let cached = 0;

  for (let i = 0; i < pageUrls.length; i += CHUNK_SIZE) {
    const chunk = pageUrls.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            cached++;
            // Post message to client about progress
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
              client.postMessage({
                type: 'CACHE_PROGRESS',
                total: pageUrls.length,
                cached: cached
              });
            });
          }
        } catch (error) {
          console.error(`Failed to cache ${url}:`, error);
        }
      })
    );
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // First cache static assets
      await cache.addAll(STATIC_ASSETS);

      // Then cache images
      await cachePageImages(cache);

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        // First try the cache
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, try network
        const fetchResponse = await fetch(event.request);
        // Cache the new response
        cache.put(event.request, fetchResponse.clone());
        return fetchResponse;
      } catch (error) {
        // If both cache and network fail, return fallback for images
        if (event.request.url.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
          return new Response(
            '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text x="50" y="50" text-anchor="middle" fill="white">الصورة غير متوفرة</text></svg>',
            {
              headers: { 'Content-Type': 'image/svg+xml' },
            }
          );
        }
        throw error;
      }
    })()
  );
});