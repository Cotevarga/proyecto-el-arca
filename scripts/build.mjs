import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, relative, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ENV = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'ukpoprkdgezgxlkjjuve';
const EDGE_FUNCTIONS_URL = process.env.EDGE_FUNCTIONS_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

function injectEnv(filePath, content) {
  let result = content
    .replace(/\$\{SUPABASE_PROJECT_ID\}/g, SUPABASE_PROJECT_ID)
    .replace(/\$\{SUPABASE_URL\}/g, SUPABASE_URL)
    .replace(/\$\{SUPABASE_ANON_KEY\}/g, SUPABASE_ANON_KEY)
    .replace(/\$\{EDGE_FUNCTIONS_URL\}/g, EDGE_FUNCTIONS_URL);
  return result;
}

async function build() {
  console.log(`🚀 Building El Arca v3.0.0 [${ENV}]`);

  // 1. Inject environment variables into HTML files
  const htmlFiles = [
    'admin.html', 'index.html', 'galeria.html', 'videos.html',
    'relatos.html', 'archivo.html', 'subir.html', 'mapa.html',
    'legado.html', 'autora.html', 'status.html', 'terminos.html',
    'plan-gestion.html', 'impacto.html'
  ];

  const distDir = join(ROOT, 'dist');
  if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

  for (const file of htmlFiles) {
    const srcPath = join(ROOT, file);
    try {
      let content = readFileSync(srcPath, 'utf-8');
      content = injectEnv(file, content);
      writeFileSync(join(distDir, file), content, 'utf-8');
      console.log(`  ✅ ${file} -> dist/${file}`);
    } catch (e) {
      if (e.code !== 'ENOENT') console.error(`  ❌ ${file}: ${e.message}`);
    }
  }

  // 2. Copy static assets
  const staticDirs = ['images', 'musica', 'i18n', 'relatos'];
  for (const dir of staticDirs) {
    const srcDir = join(ROOT, dir);
    const dstDir = join(distDir, dir);
    if (!existsSync(srcDir)) continue;
    if (!existsSync(dstDir)) mkdirSync(dstDir, { recursive: true });
    const entries = readdirSync(srcDir);
    for (const entry of entries) {
      const srcPath = join(srcDir, entry);
      if (statSync(srcPath).isFile()) {
        writeFileSync(join(dstDir, entry), readFileSync(srcPath));
      }
    }
    console.log(`  📁 ${dir}/ -> dist/${dir}/`);
  }

  // 3. Copy root assets
  const rootFiles = ['config.js', 'supabase.js', 'app.js', 'search.js', 'audio-player.js',
    'manifest.json', 'sw.js', 'robots.txt', 'sitemap.xml', 'favicon.ico'];
  for (const file of rootFiles) {
    const srcPath = join(ROOT, file);
    try {
      let content = readFileSync(srcPath, 'utf-8');
      content = injectEnv(file, content);
      writeFileSync(join(distDir, file), content, 'utf-8');
    } catch (e) {
      if (e.code !== 'ENOENT') console.error(`  ⚠️  ${file} not found, skipping`);
    }
  }

  console.log('\n✅ Build complete');
}

build().catch(e => { console.error(e); process.exit(1); });
