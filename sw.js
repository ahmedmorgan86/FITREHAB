const CACHE = 'fitrehab-next-v2';
const IDS = ['squat', 'pushup', 'lunge', 'press', 'plank', 'row', 'bridge', 'curl'];
const CORE = ['./', './index.html', './privacy.html', './styles.css', './app.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  ...IDS.flatMap(x => [`./media/${x}.png`, `./media/${x}.mp4`])];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));

// Safari/iOS request video with Range headers; a plain cached 200 breaks playback offline.
async function rangeFromCache(req) {
  const cached = await caches.match(req.url);
  if (!cached) return fetch(req);
  const buf = await cached.arrayBuffer(), size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let start = m && m[1] ? +m[1] : 0, end = m && m[2] ? Math.min(+m[2], size - 1) : size - 1;
  if (start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'Content-Type': 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (req.headers.has('range')) { e.respondWith(rangeFromCache(req)); return; }

  // media never changes: cache-first
  if (url.pathname.includes('/media/')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.status === 200) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; })));
    return;
  }

  // everything else: network first, fall back to cache (offline), pages fall back to the app shell
  e.respondWith(fetch(req).then(r => {
    if (r.status === 200) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
