window.API_BASE = '';

(function () {
  'use strict';

  var mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // ─── 1. Inicialización global segura de Supabase ───
  var supClient = null;

  function asegurarSupabase() {
    if (supClient) return Promise.resolve(supClient);
    if (window._supabase) {
      supClient = window._supabase;
      return Promise.resolve(supClient);
    }
    if (typeof window.inicializarSupabase === 'function') {
      window.inicializarSupabase();
      if (window._supabase) {
        supClient = window._supabase;
        return Promise.resolve(supClient);
      }
    }
    console.error("[Galeria] Supabase no encontrado en el scope global");
    return Promise.resolve(null);
  }

  // ─── Error banner ───
  var errorBanner = document.createElement('div');
  errorBanner.id = 'arca-error-banner';
  errorBanner.style.cssText =
    'display:none;position:fixed;top:64px;left:0;right:0;z-index:99990;' +
    'background:rgba(229,9,20,0.08);color:rgba(229,9,20,0.6);' +
    'text-align:center;padding:8px 16px;font-size:12px;' +
    'letter-spacing:0.05em;border-bottom:1px solid rgba(229,9,20,0.1);' +
    'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
  errorBanner.textContent = '\u26a0 Servicio degradado temporalmente \u2014 algunas funciones pueden no estar disponibles.';
  document.body.appendChild(errorBanner);

  // ─── Estilos persistentes para SPA ───
  var persistentStyles = document.createElement('style');
  persistentStyles.textContent =
    'h1, h2, h3, h4, h5, h6, footer, p { text-align: center !important; } ' +
    '.card-mir p, article p { text-align: justify !important; } ' +
    '#legado .text-mir, #mistica .text-mir, #comunicacion .text-mir { text-align: left !important; } ' +
    '#legado h2, #mistica h2, #comunicacion h2 { text-align: left !important; } ' +
    '#mapa .text-mir, #mapa h2, #mapa p, #mapa span, #mapa .heading-mir { text-align: left !important; }';
  persistentStyles.id = 'arca-persistent-styles';
  document.head.appendChild(persistentStyles);

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
    if (!contenedor) {
      console.warn('[SPA] Contenedor no v\u00e1lido, omitiendo re-ejecuci\u00f3n');
      return;
    }
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
            setTimeout(function () { reejecutarScripts(mainContent); }, 100);
            mergeStyles(doc);
            if (doc.title) document.title = doc.title;
            history.pushState(null, '', url);
            window.scrollTo(0, 0);
            notificarGA();
            window.showArcaError(false);

            cambiarVista(url);
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

  // ─── Galería: cargar desde Supabase ───
  var FALLBACK_IMAGES = [
    { url: '/images/FB_IMG_1782701605358.jpg' },
    { url: '/images/FB_IMG_1782701655071.jpg' },
    { url: '/images/FB_IMG_1782701775498.jpg' },
    { url: '/images/FB_IMG_1782701859802.jpg' },
    { url: '/images/FB_IMG_1782701766075.jpg' },
    { url: '/images/FB_IMG_1782701826979.jpg' },
    { url: '/images/jano_inicio.jpg' },
    { url: '/images/navidad_popular.jpg' },
    { url: '/images/companeros_melon.jpg' },
    { url: '/images/radio_libre.jpg' },
    { url: '/images/antupeni.jpg' }
  ];

  window._galeriaImages = [];
  window._galeriaCurrentIndex = 0;

  function renderizarGaleria() {
    var thumbCol = document.getElementById('thumb-col');
    var viewerImg = document.getElementById('main-viewer-img');
    var viewerEmpty = document.getElementById('viewer-empty');
    if (!thumbCol) return;

    var imgs = window._galeriaImages || [];
    thumbCol.innerHTML = '';

    if (imgs.length === 0) {
      if (viewerEmpty) viewerEmpty.style.display = '';
      return;
    }

    imgs.forEach(function (img, idx) {
      var thumb = document.createElement('img');
      thumb.className = 'gallery-thumb' + (idx === 0 ? ' active' : '');
      thumb.src = img.url;
      thumb.loading = 'lazy';
      thumb.addEventListener('click', function () {
        window._galeriaCurrentIndex = idx;
        mostrarGaleria(idx);
      });
      thumbCol.appendChild(thumb);
    });

    mostrarGaleria(0);
  }

  window.mostrarGaleria = function (idx) {
    var imgs = window._galeriaImages || [];
    if (!imgs[idx]) return;

    window._galeriaCurrentIndex = idx;

    var viewerLoader = document.getElementById('viewer-loader');
    var viewerImg = document.getElementById('main-viewer-img');
    var viewerEmpty = document.getElementById('viewer-empty');

    if (viewerLoader) viewerLoader.style.display = 'block';
    if (viewerImg) viewerImg.style.opacity = '0';
    if (viewerEmpty) viewerEmpty.style.display = 'none';

    var img = new Image();
    img.onload = function () {
      if (viewerImg) { viewerImg.src = imgs[idx].url; viewerImg.style.opacity = '1'; }
      if (viewerLoader) viewerLoader.style.display = 'none';
    };
    img.onerror = function () {
      if (viewerImg) { viewerImg.src = imgs[idx].url; viewerImg.style.opacity = '1'; }
      if (viewerLoader) viewerLoader.style.display = 'none';
    };
    img.src = imgs[idx].url;

    var thumbCol = document.getElementById('thumb-col');
    if (thumbCol) {
      var thumbs = thumbCol.querySelectorAll('.gallery-thumb');
      thumbs.forEach(function (t, i) {
        t.classList.toggle('active', i === idx);
        if (i === idx) t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  };

  // ─── 2. Función de carga de galería con reintento y validación ───
  async function cargarGaleria() {
    console.log("Iniciando carga de galería...");
    var client = await asegurarSupabase();

    if (!client) {
      console.warn("[Galeria] Supabase sigue no disponible");
      return;
    }

    var galeriaContenedor = document.getElementById('galeria-container');
    if (galeriaContenedor) {
      galeriaContenedor.innerHTML = '';
    }

    var thumbCol = document.getElementById('thumb-col');
    if (!thumbCol) {
      console.warn("[Galeria] thumb-col no encontrado en el DOM actual");
      return;
    }

    var thumbLoader = document.getElementById('thumb-loader');
    var viewerImg = document.getElementById('main-viewer-img');
    var viewerEmpty = document.getElementById('viewer-empty');

    thumbCol.innerHTML = '';
    if (thumbLoader) thumbLoader.remove();
    if (viewerImg) { viewerImg.src = ''; viewerImg.style.opacity = '0'; }
    if (viewerEmpty) viewerEmpty.style.display = '';

    window._galeriaImages = [];
    window._galeriaCurrentIndex = 0;

    console.log("Supabase disponible, procediendo con fetch...");

    client.from('galeria')
      .select('url_imagen, titulo')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .then(function (res) {
        if (res.error) throw res.error;
        if (res.data && res.data.length > 0) {
          window._galeriaImages = res.data.map(function (item) {
            return { url: item.url_imagen, titulo: item.titulo };
          });
        } else {
          console.warn('[Galeria] 0 registros con activo=true, usando fallback');
          window._galeriaImages = FALLBACK_IMAGES.slice();
        }
        renderizarGaleria();
      })
      .catch(function (err) {
        console.error('[Galeria] Error al consultar Supabase:', err);
        window._galeriaImages = FALLBACK_IMAGES.slice();
        renderizarGaleria();
      });
  }

  function cambiarVista(url) {
    var targetPath = new URL(url, window.location.origin).pathname;
    if (targetPath.indexOf('galeria') !== -1) {
      console.log("Navegando a galer\u00eda, forzando carga...");
      cargarGaleria();
    }
    try { if (typeof gtag === 'function') gtag('config', 'G-0M3Q8DQ3QF', { 'page_path': targetPath }); } catch (e) {}
  }

  window.cargarGaleria = cargarGaleria;
  window.cambiarVista = cambiarVista;

  window.inicializarGaleria = function () {
    if (window.location.pathname.indexOf('galeria') !== -1) {
      var check = function () {
        if (window._supabase) { cargarGaleria(); return true; }
        return false;
      };
      if (!check()) {
        var iv = setInterval(function () { if (check()) clearInterval(iv); }, 100);
        setTimeout(function () { clearInterval(iv); }, 8000);
      }
    }
  };

  window.inicializarGaleria();
})();
