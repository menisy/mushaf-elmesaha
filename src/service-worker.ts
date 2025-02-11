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
const cachePageImages = async () => {
  const pageUrls = [];
  for (let i = 3; i <= 851; i++) {
    const pageNumber = i.toString().padStart(3, '0');
    pageUrls.push(`/new_pages/${pageNumber}.png`);
  }
  return pageUrls;
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const pageUrls = await cachePageImages();
      const allAssets = [...STATIC_ASSETS, ...pageUrls];

      // Cache assets in chunks to avoid memory issues
      const CHUNK_SIZE = 50;
      for (let i = 0; i < allAssets.length; i += CHUNK_SIZE) {
        const chunk = allAssets.slice(i, i + CHUNK_SIZE);
        await cache.addAll(chunk);
      }

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
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

      // Try to get the resource from the cache
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, try to fetch it
      try {
        const fetchResponse = await fetch(event.request);
        cache.put(event.request, fetchResponse.clone());
        return fetchResponse;
      } catch (e) {
        // If fetch fails, return a fallback response for images
        if (event.request.url.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
          return new Response(
            '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text x="50" y="50" text-anchor="middle">Image not available offline</text></svg>',
            {
              headers: { 'Content-Type': 'image/svg+xml' },
            }
          );
        }
        throw e;
      }
    })()
  );
});