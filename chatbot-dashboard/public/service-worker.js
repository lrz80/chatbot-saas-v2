// /public/service-worker.js
const CACHE_NAME = "aamy-cache-v3";

// Solo estáticos propios SIN hash que sí conviene cachear.
// No incluyas "/_next/*" ni páginas HTML aquí.
const urlsToCache = [
  "/manifest.json",
  "/favicon.ico",
  "/aamy-icon-192.png",
  "/aamy-icon-512.png",
  "/og-image.png"
];

// ✅ Instalar: precache de estáticos básicos (no HTML)
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        urlsToCache.map(async (url) => {
          try {
            const resp = await fetch(url, { cache: "no-cache" });
            if (resp.ok) await cache.put(url, resp.clone());
          } catch (e) {
            // Silencioso: si falla alguno, no bloquea la instalación
          }
        })
      );
      self.skipWaiting();
    })()
  );
});

// ✅ Activar: limpia cachés viejos y toma control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

// ✅ Fetch:
// - NO interceptar backend ni auth/api
// - NO tocar "/_next/*"
// - Navegaciones HTML: siempre a red
// - Assets propios: cache-first
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignora métodos no-GET
  if (req.method !== "GET") return;

  // 🚫 0) Nunca interceptar llamadas al backend ni endpoints de auth/api
  const isBackend = url.hostname === "api.aamy.ai";
  const isApiPath =
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/auth");

  if (isBackend || isApiPath) {
    return; // Bypass total
  }

  // 🚫 1) Nunca interceptar estáticos de Next.js
  if (url.pathname.startsWith("/_next/")) return;

  // 🌐 2) Navegaciones (HTML): network-first (sin cachear)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match("/")) || Response.error();
      })
    );
    return;
  }

  // 📦 3) Assets propios listados: cache-first
  if (urlsToCache.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        const resp = await fetch(req);
        if (resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      })()
    );
    return;
  }

  // 🌍 4) Resto: ir directo a red (sin interceptar)
});
