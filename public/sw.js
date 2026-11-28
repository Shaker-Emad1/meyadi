const C = 'meyadi-v3';
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['/assets/app.css', '/assets/icon.svg']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });
