// Офлайн-режим. Приложение открывается без интернета; при наличии сети всегда берёт свежую версию.
const V = 'mama-diary-v4';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);

  // шрифты Google: кладём в кэш, чтобы дневник выглядел так же и без сети
  if (u.origin !== location.origin) {
    if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
      e.respondWith(
        caches.open(V).then((c) =>
          c.match(req).then((m) => m || fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => m))
        )
      );
    }
    return;
  }

  // всё остальное: сначала сеть (свежая версия и свежий love.json), при отсутствии сети кэш
  e.respondWith(
    fetch(req)
      .then((r) => { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then((m) => m || caches.match('index.html')))
  );
});
