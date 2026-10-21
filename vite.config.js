import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = process.cwd();
const pagePaths = new Set([
  'admin.html',
  'archivo.html',
  'autora.html',
  'galeria.html',
  'impacto.html',
  'index.html',
  'legado.html',
  'mapa.html',
  'plan-gestion.html',
  'relatos.html',
  'status.html',
  'subir.html',
  'terminos.html',
  'videos.html',
  'relatos/anecdotas.html',
  'relatos/arca.html',
  'relatos/jano-arca.html',
  'relatos/jano.html',
  'relatos/organizaciones.html',
]);
const legacyCssPaths = new Set(
  [...pagePaths]
    .filter((path) => path.endsWith('.html'))
    .map((path) => path.replace(/\.html$/, '.css')),
);

function legacyPagesPlugin() {
  return {
    name: 'el-arca-legacy-pages',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url || '/', 'http://localhost').pathname;
        if (pathname === '/audio-playlist.js') {
          try {
            response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
            response.end(readFileSync(resolve(root, 'web', 'src', 'audio', 'playlist.js')));
          } catch (error) {
            next(error);
          }
          return;
        }

        const stylesPrefix = '/css/legacy/';
        if (pathname.startsWith(stylesPrefix)) {
          const relativePath = decodeURIComponent(pathname.slice(stylesPrefix.length));
          if (!legacyCssPaths.has(relativePath)) {
            response.statusCode = 404;
            response.end('Not found');
            return;
          }

          try {
            const cssPath = resolve(root, 'web', 'src', 'styles', 'legacy', relativePath);
            response.setHeader('Content-Type', 'text/css; charset=utf-8');
            response.end(readFileSync(cssPath));
          } catch (error) {
            next(error);
          }
          return;
        }

        const prefix = '/_legacy-pages/';
        if (!pathname.startsWith(prefix)) {
          next();
          return;
        }

        const relativePath = decodeURIComponent(pathname.slice(prefix.length));
        if (!pagePaths.has(relativePath)) {
          response.statusCode = 404;
          response.end('Not found');
          return;
        }

        try {
          const content = readFileSync(resolve(root, relativePath));
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(content);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  root: resolve(root, 'web'),
  publicDir: false,
  plugins: [legacyPagesPlugin()],
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
  },
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
