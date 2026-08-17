/* DESTRIER — Service Worker：页面骨架缓存，媒体网络优先 */
const CACHE = 'destrier-v17';
const SHELL = [
  './',
  './index.html',
  './en.html',
  './css/style.css',
  './js/main.js',
  './js/lang-detect.js',
  './manifest.json',
  './assets/hero.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // 媒体文件：网络优先，失败回退缓存
  if (/\.(webp|mp4|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  // 骨架：缓存优先，网络更新
  e.respondWith(
    caches.match(req).then((hit) => {
      const fetchP = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => hit);
      return hit || fetchP;
    })
  );
});
