import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LegacyPage from './components/LegacyPage.jsx';
import { navigationItems } from './navigation.js';

function pageHref(pathname) {
  if (pathname === '/') return 'index.html';
  const path = decodeURIComponent(pathname).replace(/^\/+/, '');
  return /\.html$/i.test(path) ? path : `${path}.html`;
}

function Navigation() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const isCurrent = (href) => {
    const current = location.pathname === '/' ? '/index.html' : location.pathname;
    return current === href;
  };

  return (
    <header className="arca-nav">
      <div className="arca-nav-inner">
        <Link className="arca-logo" to="/index.html" aria-label="El Arca, inicio">
          EL ARCA
        </Link>
        <div id="nav-player" aria-label="Reproductor de música" />
        <nav className="arca-links" aria-label="Navegación principal">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          className="arca-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? '×' : '☰'}
        </button>
      </div>
      <nav
        className="arca-mobile-links"
        aria-label="Navegación móvil"
        data-open={menuOpen}
      >
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            aria-current={isCurrent(item.href) ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function InternalNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleClick(event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest('a[href]');
      if (
        !anchor ||
        anchor.getAttribute('href') === '#' ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        /\/admin(?:\.html)?\/?$/i.test(url.pathname) ||
        /\/api\//i.test(url.pathname)
      ) {
        return;
      }

      const templatePath = pageHref(url.pathname);
      if (
        templatePath !== 'index.html' &&
        !window.__ELARCA_PAGE_PATHS__.has(templatePath)
      ) {
        return;
      }

      event.preventDefault();
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      if (url.pathname === location.pathname && url.hash) {
        navigate(nextUrl);
        requestAnimationFrame(() => {
          document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
        });
        return;
      }
      navigate(nextUrl);
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [location.pathname, navigate]);

  return null;
}

function ScrollToRoute() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

function NotFound() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-3xl px-6 py-24 text-center">
      <h1 className="heading-mir text-4xl">Página no encontrada</h1>
      <p className="mt-4 text-white/70">No encontramos el contenido solicitado.</p>
      <Link className="btn-mir mt-8 inline-block" to="/index.html">
        Volver al inicio
      </Link>
    </main>
  );
}

function App() {
  const location = useLocation();
  const templatePath = useMemo(
    () => pageHref(location.pathname),
    [location.pathname],
  );
  const isKnownPage =
    templatePath === 'index.html' ||
    window.__ELARCA_PAGE_PATHS__.has(templatePath);

  return (
    <>
      <Navigation />
      <InternalNavigation />
      <ScrollToRoute />
      <div className="arca-app">
        {isKnownPage ? <LegacyPage key={templatePath} templatePath={templatePath} /> : <NotFound />}
      </div>
    </>
  );
}

export default App;
