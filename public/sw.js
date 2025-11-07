// Service Worker for   Bingo Card Generator
// Provides offline functionality and PWA capabilities

const CACHE_NAME = 'bingo-cards-v2';
const essentialUrls = [
  './index.html',
  './app.js', 
  './styles.css'
];
const externalUrls = [
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Install Service Worker with graceful error handling
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('✅ Service Worker cache opened');
        
        // Cache essential files (local)
        for (const url of essentialUrls) {
          try {
            await cache.add(url);
            console.log(`✅ Cached: ${url}`);
          } catch (error) {
            console.log(`⚠️  Could not cache ${url}:`, error.message);
            // Continue with other files - don't fail the whole installation
          }
        }
        
        // Cache external files (CDN)
        for (const url of externalUrls) {
          try {
            await cache.add(url);
            console.log(`✅ Cached external: ${url}`);
          } catch (error) {
            console.log(`⚠️  Could not cache external ${url}:`, error.message);
            // External files failing is not critical
          }
        }
        
        console.log('✅ Service Worker installation completed');
      })
      .catch((error) => {
        console.log('⚠️  Service Worker cache setup failed:', error);
        // Don't fail the service worker completely
      })
  );
  
  // Force activation immediately
  self.skipWaiting();
});

// Fetch Event - Cache First Strategy for Assets
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't cache API requests
  if (event.request.url.includes('/functions/v1/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Fetch from network and cache
        return fetch(event.request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Activate Event - Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️  Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated and claimed clients');
    })
  );
});
