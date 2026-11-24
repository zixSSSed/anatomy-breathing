/* Service worker: сайт работает без интернета после первого открытия.
   Генерируется из sw.template.js при сборке (python build.py) — версия меняется вместе с файлами. */
const VERSION = "__VERSION__";
const CORE = __CORE__;
const EXTERNAL = __EXTERNAL__;
const CORE_CACHE = "core-" + VERSION;
const EXT_CACHE = "ext-v1";
const EXT_HOSTS = /(^|\.)fonts\.googleapis\.com$|(^|\.)fonts\.gstatic\.com$|(^|\.)cdnjs\.cloudflare\.com$|(^|\.)upload\.wikimedia\.org$/;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const core = await caches.open(CORE_CACHE);
    await core.addAll(CORE);
    // внешние файлы (рисунки, three.js) — по возможности, ошибка не мешает установке
    const ext = await caches.open(EXT_CACHE);
    await Promise.all(EXTERNAL.map(async (url) => {
      try {
        if (await ext.match(url)) return;
        const res = await fetch(new Request(url, { mode: "no-cors" }));
        if (res.ok || res.type === "opaque") await ext.put(url, res);
      } catch (e) { /* нет сети — закэшируем при первом просмотре */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("core-") && k !== CORE_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // страницы: сначала сеть (чтобы видеть обновления), без сети — из кэша
    if (req.mode === "navigate") {
      event.respondWith((async () => {
        try {
          const res = await fetch(req);
          const copy = res.clone();
          caches.open(CORE_CACHE).then((c) => c.put(req, copy));
          return res;
        } catch (e) {
          return (await caches.match(req, { ignoreSearch: true })) || (await caches.match("index.html"));
        }
      })());
      return;
    }
    // остальное: из кэша сразу, в фоне обновляем
    event.respondWith((async () => {
      const hit = await caches.match(req, { ignoreSearch: true });
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CORE_CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })());
    return;
  }

  // шрифты, three.js, рисунки Wikimedia: из кэша, иначе из сети с сохранением
  if (EXT_HOSTS.test(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(EXT_CACHE);
      const hit = await cache.match(req, { ignoreVary: true }) || await cache.match(req.url);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") { const copy = res.clone(); cache.put(req, copy); }
        return res;
      } catch (e) {
        return hit || Response.error();
      }
    })());
  }
});
