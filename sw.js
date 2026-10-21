/* ===========================================================
   El Arca â€” Service Worker v1.0.0
   Estrategia: Cache First para assets estÃ¡ticos,
   Network First para navegaciÃ³n (SPA)
   =========================================================== */

const CACHE_NAME = 'elarca-react-v9';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/archivo.html',
  '/galeria.html',
  '/mapa.html',
  '/relatos.html',
  '/subir.html',
  '/videos.html',
  '/autora.html',
  '/legado.html',
  '/terminos.html',
  '/plan-gestion.html',
  '/impacto.html',
  '/_legacy-pages/index.html',
  '/_legacy-pages/archivo.html',
  '/_legacy-pages/autora.html',
  '/_legacy-pages/galeria.html',
  '/_legacy-pages/impacto.html',
  '/_legacy-pages/legado.html',
  '/_legacy-pages/mapa.html',
  '/_legacy-pages/plan-gestion.html',
  '/_legacy-pages/relatos.html',
  '/_legacy-pages/subir.html',
  '/_legacy-pages/terminos.html',
  '/_legacy-pages/videos.html',
  '/_legacy-pages/relatos/anecdotas.html',
  '/_legacy-pages/relatos/arca.html',
  '/_legacy-pages/relatos/jano-arca.html',
  '/_legacy-pages/relatos/jano.html',
  '/_legacy-pages/relatos/organizaciones.html',
  '/assets/app.js',
  '/assets/index.css',
  '/audio-playlist.js',
  '/css/legacy/archivo.css',
  '/css/legacy/autora.css',
  '/css/legacy/galeria.css',
  '/css/legacy/impacto.css',
  '/css/legacy/index.css',
  '/css/legacy/legado.css',
  '/css/legacy/mapa.css',
  '/css/legacy/plan-gestion.css',
  '/css/legacy/relatos.css',
  '/css/legacy/relatos/anecdotas.css',
  '/css/legacy/relatos/arca.css',
  '/css/legacy/relatos/jano-arca.css',
  '/css/legacy/relatos/jano.css',
  '/css/legacy/relatos/organizaciones.css',
  '/css/legacy/status.css',
  '/css/legacy/subir.css',
  '/css/legacy/terminos.css',
  '/css/legacy/videos.css',
  '/config.js',
  '/supabase.js',
  '/app.js',
  '/search.js',
  '/audio-player.js',
  '/manifest.json',
  '/relatos/arca.html',
  '/relatos/jano.html',
  '/relatos/jano-arca.html',
  '/relatos/anecdotas.html',
  '/relatos/organizaciones.html',
];

// InstalaciÃ³n: precachear assets estÃ¡ticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ActivaciÃ³n: limpiar caches antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// IntercepciÃ³n de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interesar peticiones al mismo origen
  if (url.origin !== self.location.origin) return;

  // El panel admin nunca debe pasar por la cache del SW.
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/') || url.pathname === '/admin.html') return;

  // The React entry bundle has a stable URL, so always revalidate it before
  // falling back to the cached copy for offline use.
  if (url.pathname === '/assets/app.js' || url.pathname === '/site-content.js' || url.pathname.startsWith('/_legacy-pages/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Estrategia: Cache First para assets estÃ¡ticos (JS, CSS, imÃ¡genes)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Estrategia: Network First para HTML (navegaciÃ³n)
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Para todo lo demÃ¡s (API, etc.): Network Only
  event.respondWith(fetch(request).catch(() => {
    return new Response('Offline', { status: 503 });
  }));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback: mostrar pÃ¡gina offline minimalista
    return new Response(
      `<!DOCTYPE html>
      <html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>El Arca â€” Sin conexiÃ³n</title>
      <style>body{font-family:sans-serif;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;}
      h1{color:#E50914;}a{color:#E50914;}</style></head>
      <body><div><h1>âš¡ Sin conexiÃ³n</h1>
      <p>EstÃ¡s desconectado. Vuelve a intentar cuando tengas internet.</p>
      <p><a href="/">Volver al inicio</a></p></div></body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
