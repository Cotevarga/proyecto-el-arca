(function () {
  'use strict';

  var mainContent = document.getElementById('main-content');
  if (!mainContent) return;

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

 function navegar(url) {
  try {
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
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

        // --- INICIO CÓDIGO GOOGLE ANALYTICS ---
        // Avisar a Google Analytics del cambio dinámico de ruta (PJAX)
        if (typeof gtag === 'function') {
          gtag('config', 'G-0M3Q8DQ3QF', {
            'page_path': window.location.pathname
          });
        }
        // --- FIN CÓDIGO GOOGLE ANALYTICS ---

        var hash = url.indexOf('#');
        if (hash !== -1) {
          var target = document.getElementById(url.substring(hash + 1));
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
      })
      .catch(function () {
        window.location.href = url;
      });
  } catch (e) {
    window.location.href = url;
  }
}

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.getAttribute('target') === '_blank') return;
    if (link.hasAttribute('download')) return;

    var href = link.getAttribute('href');
    if (!href || href === '' || href === '#') return;
    if (href.indexOf('#') === 0) return;

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

  window.addEventListener('popstate', function () {
    window.location.reload();
  });
})();
