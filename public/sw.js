// Service worker tối thiểu — chỉ để thoả điều kiện installability của PWA,
// KHÔNG offline-first cho dữ liệu (app phụ thuộc DB, cache dữ liệu tài chính
// là sai). Chiến lược:
// - Điều hướng trang (navigation): network-only, lỗi mạng → trả /offline.
// - _next/static/*: cache-first (asset hash theo build, an toàn để cache dài hạn).
// - Còn lại (API, server actions, mọi request khác): network-only, không cache.
//
// CACHE_NAME và danh sách icon dưới đây là PLACEHOLDER — được
// scripts/generate-sw.mjs stamp lại bằng giá trị thật (BUILD_ID của Next +
// src/lib/pwa-icons.json) mỗi lần chạy `pnpm build`, để cache cũ tự bị bỏ
// qua (tên khác) sau mỗi lần deploy thay vì tích luỹ vĩnh viễn.
const CACHE_NAME = "trackearn-shell-dev";
const PRECACHE_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "__PWA_ICON_URLS__",
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
            // Chỉ cache response thành công — lỗi (404/5xx, hoặc opaque do
            // redirect cross-origin) không được ghi đè/đầu độc cache.
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          }),
      ),
    );
  }
  // Còn lại: không can thiệp, để trình duyệt tự fetch network-only.
});
