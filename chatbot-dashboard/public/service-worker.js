const CACHE_NAME = "aamy-cache-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/favicon-new.ico",
  "/aamy-icon-192.png",
  "/aamy-icon-512.png",
  "/og-image.png"
];

// ✅ Cachear archivos al instalar
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // activa de inmediato
});

// ✅ Eliminar versiones antiguas del caché
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim(); // toma control de las pestañas abiertas
});

// ✅ Servir desde caché si está offline
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
