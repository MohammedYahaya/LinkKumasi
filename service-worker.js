const CACHE_NAME = 'agrilink-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/browse.html',
  '/farmer-dashboard.html',
  '/buyer-dashboard.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/lang.js',
  '/assets/js/algorithms.js'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
