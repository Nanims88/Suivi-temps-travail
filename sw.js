const CACHE_NAME = "suivi-temps-shell-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./Fournisseurs.html",
  "./manifest-fournisseurs.json",
  "./icons-fournisseurs/icon-192.png",
  "./icons-fournisseurs/icon-512.png",
  "./icons-fournisseurs/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Réseau d'abord (pour toujours servir la dernière version déployée),
// avec repli sur le cache si hors-ligne. Les appels à Supabase (autre
// origine) ne sont pas interceptés. Deux pages partagent ce service
// worker (index.html et Fournisseurs.html) : en secours hors-ligne pour
// une navigation non trouvée en cache, on retombe sur la page demandée
// elle-même plutôt que systématiquement sur index.html.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  const fallbackShell = req.url.includes("Fournisseurs.html") ? "./Fournisseurs.html" : "./index.html";

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match(fallbackShell)))
  );
});
