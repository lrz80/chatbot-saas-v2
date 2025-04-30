const CACHE_NAME = "aamy-cache-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/favicon-new.ico",
  "/aamy-icon-192.png",
  "/aamy-icon-512.png",
  "/og-image.png"
];

// Cachear archivos al instalar
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Servir desde caché al estar offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
