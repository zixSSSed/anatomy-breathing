/* Service worker: сайт работает без интернета после первого открытия.
   Генерируется из sw.template.js при сборке (python build.py) — версия меняется вместе с файлами. */
const VERSION = "d8e979213d57";
const CORE = ["./","assets/Cards-p0KFj3AE.js","assets/Content-DREVAqiT.js","assets/Drills-B-Mx-JBe.js","assets/Glossary-Cf_tjHt-.js","assets/Home-BCXnGJ8w.js","assets/Progress-BcIvKLBS.js","assets/Quiz-hoZ3FgA7.js","assets/Tickets-DeFV0Q92.js","assets/content-uUfT_loD.js","assets/index-BqFTJEDt.css","assets/index-ChtiVZ0j.js","assets/motion-wHvDDoUQ.js","assets/quiz-BULKh6IE.js","assets/react-SIwY82C9.js","assets/study-DXuQLZhq.js","assets/three-BhEAex7E.js","assets/use-transform-CXxeoUzh.js","icons/apple-touch-icon.png","icons/favicon-64.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest"];
const EXTERNAL = ["https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Blausen_0770_RespiratorySystem_02.png/960px-Blausen_0770_RespiratorySystem_02.png","https://upload.wikimedia.org/wikipedia/commons/8/87/Gray855.png","https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Paranasal_Sinuses_labelled.png/960px-Paranasal_Sinuses_labelled.png","https://upload.wikimedia.org/wikipedia/commons/7/7c/Gray994.png","https://upload.wikimedia.org/wikipedia/commons/8/85/Gray961.png","https://upload.wikimedia.org/wikipedia/commons/5/50/Gray956.png","https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Lungs_diagram_detailed.svg/960px-Lungs_diagram_detailed.svg.png","https://upload.wikimedia.org/wikipedia/commons/7/7a/Gray962.png","https://upload.wikimedia.org/wikipedia/commons/f/fb/Gray970.png","https://upload.wikimedia.org/wikipedia/commons/8/8f/Gray975.png","https://upload.wikimedia.org/wikipedia/commons/a/ab/Gray965.png","https://upload.wikimedia.org/wikipedia/commons/0/01/Gray968.png","https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Blausen_0742_Pneumothorax.png/960px-Blausen_0742_Pneumothorax.png","https://upload.wikimedia.org/wikipedia/commons/f/f3/Anatomy_and_physiology_of_animals_Inspiration_%26_expiration.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Gas_exchange_in_the_aveolus_simple_%28en%29.svg/960px-Gas_exchange_in_the_aveolus_simple_%28en%29.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Lungvolumes.svg/960px-Lungvolumes.svg.png"];
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
