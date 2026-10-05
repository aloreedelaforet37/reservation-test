const VERSION = 'v2026-10-04-1';   // à changer à chaque déploiement
const PREFIX = 'kennel-test-';      // propre à l'environnement de test (la prod garde un autre préfixe)
const CACHE = PREFIX + VERSION;

self.addEventListener('install', (e) => {
  self.skipWaiting();               // active tout de suite le nouveau SW
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([
    './', './index.html', './script.js', './style.css'
  ])));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      // ne supprime que les anciens caches de CET environnement (le cache de la prod est conservé)
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())   // prend le contrôle des pages déjà ouvertes
  );
});

// Réseau d'abord, cache en secours (hors ligne)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Uniquement les fichiers du site : Supabase (données clients, auth), EmailJS, Google, etc.
  // ne passent jamais par le cache
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    // no-cache : force la revalidation, le cache HTTP du navigateur / de GitHub Pages ne sert pas de fichier périmé
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {                           // on ne mémorise pas les 404 / 500
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)));
        }
        return res;
      })
      // ignoreSearch : script.js?v=... retrouve la copie mise en cache
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || Response.error()))
  );
});