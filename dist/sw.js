/* ===========================================================
   El Arca — Service Worker v1.0.0
   Estrategia: Cache First para assets estáticos,
   Network First para navegación (SPA)
   =========================================================== */

const CACHE_NAME = 'elarca-v1';
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

// Instalación: precachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interesar peticiones al mismo origen
  if (url.origin !== self.location.origin) return;

  // Estrategia: Cache First para assets estáticos (JS, CSS, imágenes)
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

  // Estrategia: Network First para HTML (navegación)
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Para todo lo demás (API, etc.): Network Only
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
    // Fallback: mostrar página offline minimalista
    return new Response(
      `<!DOCTYPE html>
      <html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>El Arca — Sin conexión</title>
      <style>body{font-family:sans-serif;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;}
      h1{color:#E50914;}a{color:#E50914;}</style></head>
      <body><div><h1>⚡ Sin conexión</h1>
      <p>Estás desconectado. Vuelve a intentar cuando tengas internet.</p>
      <p><a href="/">Volver al inicio</a></p></div></body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
