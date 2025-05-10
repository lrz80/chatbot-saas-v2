const CACHE_NAME = "aamy-cache-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/favicon-new.ico",
  "/aamy-icon-192.png",
  "/aamy-icon-512.png",
  "/og-image.png"
];

// ✅ Cachear archivos al instalar (con validación)
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of urlsToCache) {
        try {
          const response = await fetch(url, { cache: "no-cache" });
          if (response.ok) {
            await cache.put(url, response.clone());
          } else {
            console.warn(`⚠️ No se pudo cachear ${url}: ${response.status}`);
          }
        } catch (err) {
          console.error(`❌ Error cacheando ${url}:`, err);
        }
      }
    })
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
