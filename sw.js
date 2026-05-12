// Service Worker untuk PWA Coffe Adel
const CACHE_NAME = 'coffe-adel-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/offline.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/image/copi.jpg',
    '/image/minum.jpg',
    '/image/minumm.jpg'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control of all clients
    self.clients.claim();
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache images and other assets
                    if (event.request.url.includes('/image/') ||
                        event.request.url.includes('.css') ||
                        event.request.url.includes('.js')) {
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                    }

                    return response;
                }).catch(() => {
                    // Return offline page or cached response for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline.html');
                    }
                });
            })
    );
});

// Background sync for orders (if needed in future)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync-orders') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Implement background sync logic here if needed
}