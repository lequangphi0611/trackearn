// Service worker tối thiểu — chỉ để thoả điều kiện installability của PWA,
// KHÔNG offline-first cho dữ liệu (app phụ thuộc DB, cache dữ liệu tài chính
// là sai). Chiến lược:
// - Điều hướng trang (navigation): network-only, lỗi mạng → trả /offline.
// - _next/static/*: cache-first (asset hash theo build, an toàn để cache dài hạn).
// - Còn lại (API, server actions, mọi request khác): network-only, không cache.
const CACHE_NAME = "trackearn-shell-v1";
const PRECACHE_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // POST/server action luôn qua mạng

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline")),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
  }
  // Còn lại: không can thiệp, để trình duyệt tự fetch network-only.
});
