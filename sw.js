// Service worker: permite instalar el portal y el admin como app y abrirlos aunque la red falle.
// Estrategia "red primero": siempre se intenta la versión más nueva y se usa la copia guardada solo sin conexión.
const CACHE = "nexus-v1";
const SHELL = [
  "./", "./index.html", "./admin.html", "./negocio.html",
  "./css/styles.css", "./css/admin.css",
  "./js/firebase.js", "./js/ui.js", "./js/auth.js", "./js/business-view.js",
  "./js/index.js", "./js/admin.js", "./js/negocio.js",
  "./manifest.webmanifest", "./admin.webmanifest",
  "./assets/icons/icon-192.png", "./assets/icons/icon-512.png",
  "./assets/icons/admin-192.png", "./assets/icons/admin-512.png",
  "./assets/logos/delta.png", "./assets/logos/santo-taco.png", "./assets/logos/fiza.png",
  "./assets/logos/rival-gym.png", "./assets/logos/autolavado.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
