// ── SERVICE WORKER · Finanzas del Hogar ─────────────────────────
const CACHE = 'finanzas-v1';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icon.svg'];

// Instalar: guardar archivos en cache
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ARCHIVOS); })
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache primero, luego red, fallback a index
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        // Cachear respuestas exitosas del mismo origen
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        // Sin red: servir index.html como fallback
        return caches.match('./index.html');
      });
    })
  );
});
