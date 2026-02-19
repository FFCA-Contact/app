const CACHE_NAME = 'impact-tester-ffca-v1';

const PRECACHE_PATHS = [
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/app.js',
  'assets/empty-page.jpeg',
  'assets/deer.jpeg',
  'assets/wildboar.jpeg',
  'assets/deer-organs.jpeg',
  'assets/wildboar-organs.jpeg',
  'assets/rotate-smartphone.png'
];

function precacheUrls() {
  var base = self.location.origin + self.location.pathname.replace(/\/sw\.js$/, '/');
  return PRECACHE_PATHS.map(function (path) { return base + path; });
}

self.addEventListener('install', function (event) {
  var urls = precacheUrls();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.allSettled(
        urls.map(function (url) {
          return cache.add(url).catch(function () {});
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).then(function (response) {
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(event.request, clone);
      });
      return response;
    }).catch(function () {
      return caches.match(event.request).then(function (cached) {
        return cached || caches.match('index.html');
      });
    })
  );
});
