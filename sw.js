const VERSION = 'v2026-11-24-1';   // à changer à chaque déploiement
const CACHE = 'kennel-' + VERSION;

self.addEventListener('install', (e) => {
  self.skipWaiting();               // active tout de suite le nouveau SW
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([
    './', './index.html', './script.js', './style.css'
  ])));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())   // prend le contrôle des pages déjà ouvertes
  );
});

// Réseau d'abord, cache en secours (hors ligne)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
