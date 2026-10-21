/* app offline-friendly: pagina e codice sempre dalla rete se c'e', modelli e immagini dalla cache (cambiano nome quando cambiano) */
const C = 'mt-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const heavy = /\/(assets|models)\/|\.(png|glb|webp)$/.test(r.url);
  if (heavy) e.respondWith(caches.open(C).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));
  else e.respondWith(fetch(r).then(res => { if (res.ok) caches.open(C).then(c => c.put(r, res.clone())); return res; }).catch(() => caches.match(r)));
});
