/* Küchenlager Offline-Cache: Seite zuerst aus dem Netz (damit Updates ankommen), sonst aus dem Cache. */
const CACHE = 'shelfmate-v40';
const IMG = 'shelfmate-img-v1';
const PAGE = new URL('./', self.registration.scope).href;
const CORE = [
  PAGE,
  new URL('shelfmateClient.js', self.registration.scope).href,
  new URL('i18n.js', self.registration.scope).href,
];
const CDN = ['https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await Promise.all(CDN.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k !== IMG) await caches.delete(k);
    await self.clients.claim();
  })());
});

const norm = req => { const u = new URL(req.url); u.search = ''; return u.href; };
const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;                  // Daten und Live-Verbindung nie anfassen

  // Seite + Transport-Skript: sofort aus dem Cache (schnell, auch offline), im Hintergrund erneuern.
  // Update-Prüfung (?_=) und Reload auf neue Version (?v=) gehen immer zuerst ins Netz.
  if (url.origin === location.origin && (norm(req) === PAGE || url.pathname === '/shelfmateClient.js' || url.pathname === '/i18n.js')) {
    e.respondWith((async () => {
      const key = norm(req);
      const c = await caches.open(CACHE);
      const fresh = url.searchParams.has('_') || url.searchParams.has('v') || req.cache === 'no-store';
      const net = () => fetch(req).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; });
      if (fresh && req.mode !== 'navigate') {
        try { return await timeout(net(), 3000); } catch (_) { return (await c.match(key)) || Response.error(); }
      }
      const hit = await c.match(key);
      if (hit) { e.waitUntil(timeout(net(), 5000).catch(() => {})); return hit; }
      return net();
    })());
    return;
  }

  // Scanner-Bibliothek: Cache zuerst
  if (CDN.includes(req.url)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      return (await c.match(req.url)) || fetch(req).then(r => { c.put(req.url, r.clone()); return r; });
    })());
    return;
  }

  // Produktbilder: Cache zuerst, sonst laden und merken (max. 200)
  if (req.destination === 'image' && url.origin !== location.origin) {
    e.respondWith((async () => {
      const c = await caches.open(IMG);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const r = await fetch(req);
        c.put(req, r.clone());
        c.keys().then(k => { if (k.length > 200) c.delete(k[0]); });
        return r;
      } catch (_) { return Response.error(); }
    })());
  }
});
