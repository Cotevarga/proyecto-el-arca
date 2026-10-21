import React, { useEffect, useState } from 'react';
import { enhanceForms } from '../utils/forms.js';

const globalScripts = new Set([
  '/app.js',
  '/audio-player.js',
  '/config.js',
  '/supabase.js',
  '/search.js',
]);
const externalScripts = new Map();

function isJavaScript(script) {
  const type = script.getAttribute('type') || '';
  return !type || /^(text|application)\/(javascript|ecmascript)$/i.test(type);
}

function loadExternalScript(source, cache = true) {
  if (cache && externalScripts.has(source)) return externalScripts.get(source);

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${source}`));
    document.head.appendChild(script);
  });

  if (cache) externalScripts.set(source, promise);
  return promise;
}

function runInlineScript(code) {
  const queuedReadyHandlers = [];
  const originalAddEventListener = document.addEventListener;
  document.addEventListener = function (type, listener, options) {
    if (type === 'DOMContentLoaded' && typeof listener === 'function') {
      queuedReadyHandlers.push(listener);
      return;
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  try {
    // Legacy templates expose declarations to inline handlers in the global scope.
    // Un <script> inline cumple la CSP de producción (no permite 'unsafe-eval').
    const el = document.createElement('script');
    el.textContent = code;
    document.head.appendChild(el);
    el.remove();
  } finally {
    document.addEventListener = originalAddEventListener;
  }

  const readyEvent = new Event('DOMContentLoaded');
  queuedReadyHandlers.forEach((listener) => listener.call(document, readyEvent));
}

async function runPageScripts(scripts, active) {
  const appScript = loadExternalScript('/app.js');
  const playerScript = loadExternalScript('/audio-player.js');
  await Promise.all([appScript, playerScript]);

  for (const script of scripts) {
    if (!active()) return;

    if (script.src) {
      const url = new URL(script.src, window.location.href);
      const pathname = url.pathname;
      if (
        globalScripts.has(pathname) ||
        pathname.includes('/@tailwindcss/browser') ||
        pathname.includes('/googletagmanager/')
      ) {
        if (pathname === '/search.js') {
          await loadExternalScript(pathname, false);
        }
        continue;
      }
      await loadExternalScript(url.href);
      continue;
    }

    if (!isJavaScript(script)) continue;
    const code = script.textContent.trim();
    if (
      !code ||
      code.includes('window.dataLayer') ||
      code.includes('navigator.serviceWorker.register')
    ) {
      continue;
    }
    runInlineScript(code);
  }

  if (active() && typeof window.cambiarVista === 'function') {
    window.cambiarVista(window.location.pathname);
  }
}

function preparePage(documentNode) {
  const scripts = [...documentNode.querySelectorAll('script')];
  const styles = [];
  const body = documentNode.body;

  body.querySelectorAll('.card-mir').forEach((card) => {
    card.classList.add('card', 'bg-dark', 'border-danger', 'text-light');
  });
  body.querySelectorAll('.btn-mir').forEach((button) => {
    button.classList.add('btn', 'btn-danger');
  });
  body.querySelectorAll('.grid').forEach((grid) => {
    const legacyClasses = [...grid.classList];
    const columns = (prefix) => {
      const match = legacyClasses
        .map((className) => className.match(new RegExp(`^${prefix}grid-cols-(\\d+)$`)))
        .find(Boolean);
      return match ? Number(match[1]) : null;
    };
    const base = columns('') ?? 1;
    const small = columns('sm:') ?? base;
    const wide = columns('md:') ?? small;
    const large = columns('lg:') ?? wide;

    legacyClasses.forEach((className) => {
      if (className === 'grid' || /^(sm:|md:|lg:)?grid-cols-\d+$/.test(className)) {
        grid.classList.remove(className);
      }
    });
    grid.classList.add('row', 'arca-cards');
    grid.style.setProperty('--arca-cols-xs', String(base));
    grid.style.setProperty('--arca-cols-sm', String(small));
    grid.style.setProperty('--arca-cols-md', String(wide));
    grid.style.setProperty('--arca-cols-lg', String(large));
  });
  body.querySelectorAll('.max-w-3xl, .max-w-5xl, .max-w-6xl').forEach((container) => {
    container.classList.add('container');
  });

  documentNode.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((source) => {
    if (
      source.tagName === 'LINK' &&
      source.href.includes('@tailwindcss/browser')
    ) {
      return;
    }

    const element = source.cloneNode(true);
    element.dataset.arcaRouteStyle = 'true';
    document.head.appendChild(element);
    styles.push(element);
  });

  body.querySelectorAll('nav, script').forEach((element) => element.remove());
  const title = documentNode.title;
  const description = documentNode.querySelector('meta[name="description"]')?.content;

  return {
    html: documentNode.body.innerHTML,
    scripts,
    styles,
    title,
    description,
  };
}

async function loadSiteContent() {
  try {
    await loadExternalScript('/site-content.js');
    return await window.ArcaContent.load();
  } catch {
    return {};
  }
}

function LegacyPage({ templatePath }) {
  const [page, setPage] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setPage(null);
    setError(false);

    Promise.all([
      fetch(`/_legacy-pages/${templatePath}`, { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      }),
      loadSiteContent(),
    ])
      .then(([html, overrides]) => {
        if (controller.signal.aborted) return;
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        window.ArcaContent?.apply(parsed.body, templatePath.replace(/\.html$/, ''), overrides);
        const nextPage = preparePage(parsed);
        document.title = nextPage.title || document.title;
        const description = document.querySelector('meta[name="description"]');
        if (description && nextPage.description) {
          description.content = nextPage.description;
        }
        setPage(nextPage);
      })
      .catch((cause) => {
        if (cause.name !== 'AbortError') {
          console.error(`No se pudo abrir ${templatePath}`, cause);
          setError(true);
        }
      });

    return () => controller.abort();
  }, [templatePath]);

  useEffect(() => {
    if (!page) return undefined;
    let active = true;
    const cleanupForms = enhanceForms(document.querySelector('.arca-app'));
    if (window.location.hash) {
      requestAnimationFrame(() => {
        document
          .getElementById(decodeURIComponent(window.location.hash.slice(1)))
          ?.scrollIntoView();
      });
    }
    runPageScripts(page.scripts, () => active).catch((cause) => {
      if (active) console.error(`Error al inicializar ${templatePath}`, cause);
    });

    return () => {
      active = false;
      cleanupForms();
      page.styles.forEach((style) => style.remove());
    };
  }, [page, templatePath]);

  if (error) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-3xl px-6 py-24 text-center">
        <h1 className="heading-mir text-4xl">No se pudo cargar la página</h1>
        <p className="mt-4 text-white/70">Intenta nuevamente en unos momentos.</p>
      </main>
    );
  }

  if (!page) {
    return (
      <main className="mx-auto min-h-[60vh] px-6 py-24 text-center" aria-live="polite">
        Cargando…
      </main>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: page.html }} />;
}

export default LegacyPage;
