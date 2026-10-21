import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as buildVite } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

let config = {
  supabaseUrl: 'https://ukpoprkdgezgxlkjjuve.supabase.co',
  anonKey: '',
  projectId: 'ukpoprkdgezgxlkjjuve',
};

try {
  const source = readFileSync(join(root, 'config.js'), 'utf-8');
  const values = {
    supabaseUrl: /SUPABASE_URL\s*=\s*'([^']+)'/,
    anonKey: /SUPABASE_ANON_KEY\s*=\s*'([^']+)'/,
    projectId: /SUPABASE_PROJECT_ID\s*=\s*'([^']+)'/,
  };
  for (const [key, pattern] of Object.entries(values)) {
    const match = source.match(pattern);
    if (match) config[key] = match[1];
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

config.supabaseUrl = process.env.SUPABASE_URL || config.supabaseUrl;
config.anonKey = process.env.SUPABASE_ANON_KEY || config.anonKey;
config.projectId = process.env.SUPABASE_PROJECT_ID || config.projectId;
config.edgeFunctionsUrl =
  process.env.EDGE_FUNCTIONS_URL ||
  `https://${config.projectId}.supabase.co/functions/v1`;

function injectEnvironment(content) {
  return content
    .replace(/\$\{SUPABASE_PROJECT_ID\}/g, config.projectId)
    .replace(/\$\{SUPABASE_URL\}/g, config.supabaseUrl)
    .replace(/\$\{SUPABASE_ANON_KEY\}/g, config.anonKey)
    .replace(/\$\{EDGE_FUNCTIONS_URL\}/g, config.edgeFunctionsUrl);
}

function copyDirectory(source, destination, filter = () => true) {
  if (!existsSync(source)) return;
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source)) {
    const sourcePath = join(source, entry);
    const destinationPath = join(destination, entry);
    if (statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destinationPath, filter);
    } else if (filter(entry, sourcePath)) {
      writeFileSync(destinationPath, readFileSync(sourcePath));
    }
  }
}

function copyInjectedDirectory(source, destination) {
  if (!existsSync(source)) return;
  for (const entry of readdirSync(source)) {
    const sourcePath = join(source, entry);
    const destinationPath = join(destination, entry);
    if (statSync(sourcePath).isDirectory()) {
      copyInjectedDirectory(sourcePath, destinationPath);
    } else {
      copyInjectedFile(sourcePath, destinationPath);
    }
  }
}

function copyInjectedFile(source, destination) {
  if (!existsSync(source)) return;
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(
    destination,
    injectEnvironment(readFileSync(source, 'utf-8')),
    'utf-8',
  );
}

async function build() {
  console.log(`Building El Arca React frontend [${environment}]`);
  await buildVite();

  const output = join(root, 'dist');
  const legacyPages = [
    'archivo.html', 'autora.html', 'galeria.html', 'impacto.html', 'index.html',
    'legado.html', 'mapa.html', 'plan-gestion.html', 'relatos.html', 'subir.html',
    'terminos.html', 'videos.html',
    'relatos/anecdotas.html', 'relatos/arca.html', 'relatos/jano-arca.html',
    'relatos/jano.html', 'relatos/organizaciones.html',
  ];

  for (const page of legacyPages) {
    copyInjectedFile(join(root, page), join(output, '_legacy-pages', page));
  }

  const shellPath = join(output, 'index.html');
  const shell = readFileSync(shellPath, 'utf-8').replace(/\r\n?/g, '\n');
  writeFileSync(shellPath, shell, 'utf-8');
  for (const page of legacyPages) {
    const source = readFileSync(join(root, page), 'utf-8');
    const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
    const description = source.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i)?.[1];
    let routeShell = shell;
    if (title) routeShell = routeShell.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
    if (description) {
      routeShell = routeShell.replace(
        /<meta\s+name="description"[^>]*>/i,
        `<meta name="description" content="${description.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`,
      );
    }
    for (const property of ['og:title', 'og:description', 'og:url', 'og:type', 'og:image']) {
      const metadata = source.match(new RegExp(`<meta\\s+property=["']${property}["'][^>]*>`, 'i'))?.[0];
      if (metadata) {
        routeShell = routeShell.replace(
          new RegExp(`<meta\\s+property=["']${property}["'][^>]*>`, 'i'),
          metadata,
        );
      }
    }
    const canonical = source.match(/<link\s+rel=["']canonical["'][^>]*>/i)?.[0];
    if (canonical) {
      routeShell = routeShell.replace(
        /<link\s+rel=["']canonical["'][^>]*>/i,
        canonical,
      );
    }
    const structuredData = source.match(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/i)?.[0];
    if (structuredData) {
      routeShell = routeShell.replace('</head>', `${structuredData}\n  </head>`);
    }
    const destination = join(output, page);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, routeShell, 'utf-8');
  }

  for (const page of ['admin.html', 'status.html']) {
    copyInjectedFile(join(root, page), join(output, page));
  }

  for (const directory of ['images', 'musica', 'i18n', 'relatos']) {
    copyDirectory(
      join(root, directory),
      join(output, directory),
      (_entry, sourcePath) =>
        directory !== 'relatos' || !sourcePath.toLowerCase().endsWith('.html'),
    );
  }

  const rootFiles = [
    'config.js', 'supabase.js', 'app.js', 'search.js', 'audio-player.js',
    'manifest.json', 'sw.js', 'robots.txt', 'sitemap.xml', 'favicon.ico',
  ];
  for (const file of rootFiles) {
    copyInjectedFile(join(root, file), join(output, file));
  }
  copyInjectedFile(
    join(root, 'web', 'src', 'audio', 'playlist.js'),
    join(output, 'audio-playlist.js'),
  );

  copyDirectory(
    join(root, 'web', 'src', 'styles', 'legacy'),
    join(output, 'css', 'legacy'),
  );

  copyInjectedDirectory(join(root, 'admin'), join(output, 'admin'));
  console.log('React frontend build complete');
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
