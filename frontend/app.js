// ─── API_BASE global — puente local/producción ──────────────
window.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000' : '';

(function () {
  'use strict';

  var mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // ─── Error banner ───────────────────────────────────────────
  var errorBanner = document.createElement('div');
  errorBanner.id = 'arca-error-banner';
  errorBanner.style.cssText =
    'display:none;position:fixed;top:64px;left:0;right:0;z-index:99990;' +
    'background:rgba(229,9,20,0.08);color:rgba(229,9,20,0.6);' +
    'text-align:center;padding:8px 16px;font-size:12px;' +
    'letter-spacing:0.05em;border-bottom:1px solid rgba(229,9,20,0.1);' +
    'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
  errorBanner.textContent = '⚠ Servicio degradado temporalmente — algunas funciones pueden no estar disponibles.';
  document.body.appendChild(errorBanner);

  window.showArcaError = function (visible) {
    errorBanner.style.display = visible ? 'block' : 'none';
    if (visible) {
      setTimeout(function () { errorBanner.style.display = 'none'; }, 8000);
    }
  };

  // ─── Google Analytics intacto ──────────────────────────────
  function notificarGA() {
    try {
      if (typeof gtag === 'function') {
        gtag('config', 'G-0M3Q8DQ3QF', {
          'page_path': window.location.pathname
        });
      }
    } catch (e) {
      // GA nunca debe romper la navegación
    }
  }

  // ─── Re-ejecutar scripts ────────────────────────────────────
  function reejecutarScripts(contenedor) {
    var scripts = contenedor.querySelectorAll('script');
    var i, j, oldScript, newScript, attrs, attr;
    for (i = 0; i < scripts.length; i++) {
      oldScript = scripts[i];
      newScript = document.createElement('script');
      attrs = oldScript.attributes;
      for (j = 0; j < attrs.length; j++) {
        attr = attrs[j];
        newScript.setAttribute(attr.name, attr.value);
      }
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.parentNode.replaceChild(newScript, oldScript);
    }
  }

  // ─── Navegación PJAX con aislamiento de fallos ─────────────
  function navegar(url) {
    try {
      fetch(url)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        })
        .then(function (html) {
          try {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var nuevo = doc.getElementById('main-content');
            if (!nuevo) {
              window.location.href = url;
              return;
            }
            mainContent.innerHTML = nuevo.innerHTML;
            reejecutarScripts(mainContent);
            if (doc.title) document.title = doc.title;
            history.pushState(null, '', url);
            window.scrollTo(0, 0);

            // Google Analytics: intacto
            notificarGA();

            // Scroll a hash si existe
            var hash = url.indexOf('#');
            if (hash !== -1) {
              var target = document.getElementById(url.substring(hash + 1));
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }

            // Ocultar error si había uno
            window.showArcaError(false);
          } catch (innerErr) {
            console.warn('Error al procesar PJAX, fallback:', innerErr);
            window.location.href = url;
          }
        })
        .catch(function (fetchErr) {
          console.warn('Error de red PJAX, fallback:', fetchErr);
          window.showArcaError(true);
          window.location.href = url;
        });
    } catch (e) {
      console.warn('Error catastrófico PJAX, fallback:', e);
      window.showArcaError(true);
      window.location.href = url;
    }
  }

  // ─── Interceptar clicks ─────────────────────────────────────
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.getAttribute('target') === '_blank') return;
    if (link.hasAttribute('download')) return;

    var href = link.getAttribute('href');
    if (!href || href === '' || href === '#') return;
    if (href.indexOf('#') === 0) return;
    if (href.indexOf('admin') !== -1 || href.indexOf('/api/') !== -1) return;

    var urlObj;
    try {
      urlObj = new URL(href, window.location.href);
    } catch (e) {
      return;
    }

    if (urlObj.origin !== window.location.origin) return;
    if (urlObj.pathname === window.location.pathname && urlObj.hash) return;

    e.preventDefault();
    navegar(urlObj.pathname + urlObj.search + urlObj.hash);
  });

  // ─── popstate ───────────────────────────────────────────────
  window.addEventListener('popstate', function () {
    window.location.reload();
  });

  // ─── Notificar GA al cargar página inicial ─────────────────
  notificarGA();
})();
