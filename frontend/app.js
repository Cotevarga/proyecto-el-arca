window.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000' : '';

(function () {
  'use strict';

  var mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // ─── Error banner ───
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

  // ─── Google Analytics ─────
  function notificarGA() {
    try {
      if (typeof gtag === 'function') {
        gtag('config', 'G-0M3Q8DQ3QF', { 'page_path': window.location.pathname });
      }
    } catch (e) {}
  }

  // ─── Re-ejecutar scripts en contenido nuevo ───
  function reejecutarScripts(contenedor) {
    var scripts = contenedor.querySelectorAll('script');
    var i, oldScript, newScript, j, attrs, attr;
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

  // ─── Extraer estilos del documento destino y agregarlos si no existen ───
  function mergeStyles(fetchedDoc) {
    var fetchedStyles = fetchedDoc.querySelectorAll('style');
    fetchedStyles.forEach(function (s) {
      var key = s.textContent ? s.textContent.substring(0, 100) : '';
      var exists = false;
      var currentStyles = document.querySelectorAll('head style');
      currentStyles.forEach(function (cs) {
        if (cs.textContent && cs.textContent.substring(0, 100) === key) {
          exists = true;
        }
      });
      if (!exists) {
        var newStyle = document.createElement('style');
        newStyle.textContent = s.textContent;
        document.head.appendChild(newStyle);
      }
    });
  }

  // ─── SPA: navegar sin recargar ───
  function navegar(url) {
    if (url === window.location.pathname) return;
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
            mergeStyles(doc);
            if (doc.title) document.title = doc.title;
            history.pushState(null, '', url);
            window.scrollTo(0, 0);
            notificarGA();
            window.showArcaError(false);
          } catch (innerErr) {
            window.location.href = url;
          }
        })
        .catch(function () {
          window.showArcaError(true);
          window.location.href = url;
        });
    } catch (e) {
      window.showArcaError(true);
      window.location.href = url;
    }
  }

  // ─── Interceptar clicks en links internos ───
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

  // ─── popstate: navegación atrás/adelante ───
  window.addEventListener('popstate', function () {
    navegar(window.location.pathname);
  });

  notificarGA();
})();
