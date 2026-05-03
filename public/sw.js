// ═══════════════════════════════════════
// StreamIQ — Service Worker
// يتيح العمل كتطبيق على الهاتف (PWA)
// ═══════════════════════════════════════

const CACHE_NAME = "streamiq-v1";
const ASSETS = ["/", "/index.html"];

// تثبيت — حفظ الملفات الأساسية
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// تفعيل — حذف الكاش القديم
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// جلب — Network first, fallback to cache
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
