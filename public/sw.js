// Mausam Saathi service worker (PRD 13.7, 27.11). Plain JS, no build step.
// Bump VERSION on each release: old caches are deleted on activate.
const VERSION = 'ms-v5';
const SHELL = ['/', '/alerts', '/forecast', '/offline', '/icons/icon-192.png'];
const API_NETWORK_FIRST = ['/api/mausam/snapshot', '/api/mausam/warnings'];

// Cache a shell page and the scripts and styles its HTML references, so
// the page can also hydrate offline (an uncached chunk would break it).
async function precachePage(url) {
  const shell = await caches.open(`${VERSION}-shell`);
  const res = await fetch(new Request(url, { cache: 'reload' }));
  if (!res.ok) return;
  await shell.put(url, res.clone());
  const html = await res.text();
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || [])];
  const stat = await caches.open(`${VERSION}-static`);
  await Promise.all(assets.map((a) => stat.add(a).catch(() => null)));
}

self.addEventListener('install', (e) => {
  e.waitUntil(Promise.all(SHELL.map((u) => (u.endsWith('.png') ? caches.open(`${VERSION}-shell`).then((c) => c.add(u)) : precachePage(u)).catch(() => null))));
  // Wait for the page to ask (update toast) unless nothing is controlled yet.
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(req, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    if (res.ok) await cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req);
    return (
      hit ||
      new Response(JSON.stringify({ error: { code: 'offline', message: 'You are offline.' } }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // On-device models: cache first (large, versioned by folder).
  if (url.pathname.startsWith('/models/') && url.pathname !== '/models/index.json') {
    e.respondWith(
      caches.open(`${VERSION}-models`).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) await c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Weather: network first with a 4 s timeout, then the last good copy.
  if (API_NETWORK_FIRST.some((p) => url.pathname.startsWith(p))) {
    e.respondWith(networkFirst(req, `${VERSION}-api`, 4000));
    return;
  }
  if (url.pathname.startsWith('/api/')) return; // never cache other APIs

  // Pages: network, then cached copy, then the offline page. Clone before
  // the page starts reading the body. Uncached pages redirect to /offline so
  // the URL matches the HTML (Next's router needs that to hydrate).
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            e.waitUntil(caches.open(`${VERSION}-pages`).then((c) => c.put(req, copy)));
          }
          return res;
        })
        .catch(async () => {
          const hit = await caches.match(req);
          if (hit) return hit;
          if (url.pathname !== '/offline') return Response.redirect('/offline', 302);
          return (await caches.match('/offline')) || Response.error();
        }),
    );
    return;
  }

  // Static assets: stale while revalidate.
  if (url.pathname.startsWith('/_next/static/') || /\.(js|css|svg|png|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(`${VERSION}-static`).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              e.waitUntil(c.put(req, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || net;
      }),
    );
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow(e.notification.data?.url || '/alerts'));
});
