import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const output = join(root, 'dist');
const routes = [
  'archivo.html',
  'autora.html',
  'galeria.html',
  'impacto.html',
  'index.html',
  'legado.html',
  'mapa.html',
  'plan-gestion.html',
  'relatos.html',
  'subir.html',
  'terminos.html',
  'videos.html',
  'relatos/anecdotas.html',
  'relatos/arca.html',
  'relatos/jano-arca.html',
  'relatos/jano.html',
  'relatos/organizaciones.html',
];

assert.ok(existsSync(join(output, 'index.html')), 'React shell must be built');
const shell = readFileSync(join(output, 'index.html'), 'utf8');
assert.match(shell, /type="module"/, 'React entrypoint must be included in the shell');
assert.ok(existsSync(join(output, 'assets')), 'Vite production assets must be present');
assert.ok(existsSync(join(output, 'assets', 'app.js')), 'Stable React bundle must be built');
assert.ok(existsSync(join(output, 'assets', 'index.css')), 'Bootstrap and application CSS must be bundled');
assert.ok(existsSync(join(output, 'audio-playlist.js')), 'The persistent playlist helper must be available at runtime');
assert.ok(existsSync(join(output, 'css', 'legacy', 'relatos.css')), 'Legacy route styles must be extracted');
assert.ok(existsSync(join(output, 'css', 'legacy', 'subir.css')), 'Contribution form styles must be extracted');
assert.match(shell, /audio-playlist\.js/, 'Persistent playlist logic must load before the React app');
assert.match(
  readFileSync(join(output, 'sw.js'), 'utf8'),
  /elarca-react-v\d+/,
  'Service worker cache must be versioned for the React application',
);
assert.match(
  readFileSync(join(output, 'sw.js'), 'utf8'),
  /url\.pathname === '\/assets\/app\.js'[\s\S]*?networkFirst\(request\)/,
  'React bundle must be revalidated before using its offline cache',
);

for (const route of routes) {
  const template = join(output, '_legacy-pages', route);
  const shellRoute = join(output, route);
  assert.ok(existsSync(template), `Route content must be available: ${route}`);
  assert.ok(existsSync(shellRoute), `React shell must be served at: ${route}`);
  assert.match(
    readFileSync(template, 'utf8'),
    /<main\b/,
    `Route must retain its original page content: ${route}`,
  );
  assert.match(
    readFileSync(shellRoute, 'utf8'),
    /type="module"/,
    `Route must load the React application: ${route}`,
  );
  assert.match(
    readFileSync(shellRoute, 'utf8'),
    /rel="canonical"/,
    `Route must retain its canonical URL: ${route}`,
  );
  assert.doesNotMatch(
    readFileSync(template, 'utf8'),
    /<style\b/i,
    `Route styles must be externalized: ${route}`,
  );
}

for (const asset of ['audio-player.js', 'app.js', 'config.js', 'supabase.js', 'admin.html', 'status.html']) {
  assert.ok(existsSync(join(output, asset)), `Existing site asset must remain available: ${asset}`);
}

const player = readFileSync(join(output, 'audio-player.js'), 'utf8');
assert.match(player, /arca-hidden-audio/, 'Persistent audio element must be preserved');
assert.match(player, /ArcaPlaylist\.nextIndex/, 'Next track must follow the persistent playlist order');
const appSource = readFileSync(join(root, 'web', 'src', 'App.jsx'), 'utf8');
assert.ok(
  appSource.indexOf('function Navigation') < appSource.indexOf('function App()'),
  'Persistent navigation must remain outside the route content',
);

console.log(`Frontend build checks passed (${routes.length} routes and persistent audio assets).`);
