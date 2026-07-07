window.API_BASE = '';

(function () {
  'use strict';

  var mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // ─── 1. Supabase persistente ───
  const getSupabase = () => window.miSupabase;

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

  window.showArcaError = function (visible) {
    errorBanner.style.display = visible ? 'block' : 'none';
    if (visible) {
      setTimeout(function () { errorBanner.style.display = 'none'; }, 8000);
    }
  };

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

  // ─── Google Analytics ─────
  function notificarGA() {
    try {
      if (typeof gtag === 'function') {
        gtag('config', 'G-0M3Q8DQ3QF', { 'page_path': window.location.pathname });
      }
    } catch (e) {}
  }

  // ─── Funciones de Lightbox (Galería) ───
  function getImgs() { return window._galeriaImages || []; }
  function getIdx() { return window._galeriaCurrentIndex || 0; }
  function setIdx(n) { window._galeriaCurrentIndex = n; }

  function cerrarLb() {
    var lb = document.getElementById('arca-lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  function mostrarLb(idx) {
    var imgs = getImgs();
    if (!imgs[idx]) return;
    var lbImg = document.getElementById('lb-main-img');
    var lbLoader = document.getElementById('lb-loader');
    if (lbLoader) lbLoader.style.display = 'block';
    if (lbImg) lbImg.style.opacity = '0';
    var img = new Image();
    img.onload = function () {
      if (lbImg) { lbImg.src = imgs[idx].url; lbImg.style.opacity = '1'; }
      if (lbLoader) lbLoader.style.display = 'none';
    };
    img.onerror = function () {
      if (lbImg) { lbImg.src = imgs[idx].url; lbImg.style.opacity = '1'; }
      if (lbLoader) lbLoader.style.display = 'none';
    };
    img.src = imgs[idx].url;
  }

  window.openLightbox = function (idx) {
    setIdx(idx);
    mostrarLb(idx);
    var lb = document.getElementById('arca-lightbox');
    if (!lb) return;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function prevLb() {
    var imgs = getImgs();
    if (imgs.length === 0) return;
    var n = (getIdx() - 1 + imgs.length) % imgs.length;
    setIdx(n);
    mostrarLb(n);
  }

  function nextLb() {
    var imgs = getImgs();
    if (imgs.length === 0) return;
    var n = (getIdx() + 1) % imgs.length;
    setIdx(n);
    mostrarLb(n);
  }

  window.cerrarLb = cerrarLb;

  // ─── 3. Inicialización de eventos de galería ───
  var _galeriaEventsVinculados = false;
  var _galeriaKeydownHandler = null;

  function inicializarEventosGaleria() {
    if (_galeriaEventsVinculados) return;

    var viewerImg = document.getElementById('main-viewer-img');
    if (viewerImg) {
      viewerImg.addEventListener('click', function () {
        if (getImgs().length > 0) window.openLightbox(getIdx());
      });
    }

    var viewerPrev = document.getElementById('viewer-prev');
    if (viewerPrev) {
      viewerPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        if (typeof window.mostrarGaleria === 'function') {
          var imgs = getImgs();
          if (imgs.length === 0) return;
          var n = (getIdx() - 1 + imgs.length) % imgs.length;
          setIdx(n);
          window.mostrarGaleria(n);
        }
      });
    }

    var viewerNext = document.getElementById('viewer-next');
    if (viewerNext) {
      viewerNext.addEventListener('click', function (e) {
        e.stopPropagation();
        if (typeof window.mostrarGaleria === 'function') {
          var imgs = getImgs();
          if (imgs.length === 0) return;
          var n = (getIdx() + 1) % imgs.length;
          setIdx(n);
          window.mostrarGaleria(n);
        }
      });
    }

    var lbClose = document.getElementById('lb-close');
    if (lbClose) lbClose.addEventListener('click', cerrarLb);

    var lb = document.getElementById('arca-lightbox');
    if (lb) {
      lb.addEventListener('click', function (e) { if (e.target === lb) cerrarLb(); });
      var touchStartX = 0;
      lb.addEventListener('touchstart', function (e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        var diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) { if (diff > 0) nextLb(); else prevLb(); }
      }, { passive: true });
    }

    var lbPrev = document.getElementById('lb-prev');
    if (lbPrev) lbPrev.addEventListener('click', function (e) { e.stopPropagation(); prevLb(); });

    var lbNext = document.getElementById('lb-next');
    if (lbNext) lbNext.addEventListener('click', function (e) { e.stopPropagation(); nextLb(); });

    if (_galeriaKeydownHandler) {
      document.removeEventListener('keydown', _galeriaKeydownHandler);
    }
    _galeriaKeydownHandler = function (e) {
      var lb = document.getElementById('arca-lightbox');
      if (!lb || !lb.classList.contains('open')) return;
      if (e.key === 'Escape') cerrarLb();
      if (e.key === 'ArrowLeft') prevLb();
      if (e.key === 'ArrowRight') nextLb();
    };
    document.addEventListener('keydown', _galeriaKeydownHandler);

    _galeriaEventsVinculados = true;
  }

  window.inicializarEventosGaleria = inicializarEventosGaleria;

  // ─── Re-ejecutar scripts en contenido nuevo ───
  function reejecutarScripts(contenedor) {
    if (!contenedor) return;

    var scripts = contenedor.querySelectorAll('script');
    for (var i = 0; i < scripts.length; i++) {
      var oldScript = scripts[i];
      var newScript = document.createElement('script');
      var attrs = oldScript.attributes;
      for (var j = 0; j < attrs.length; j++) {
        newScript.setAttribute(attrs[j].name, attrs[j].value);
      }
      if (oldScript.textContent) newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    }

  }

  // ─── Extraer estilos del documento destino ───
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

  // ─── popstate ───
  window.addEventListener('popstate', function () {
    navegar(window.location.pathname);
  });

  notificarGA();

  // ─── Galería: datos y render ───
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

  // ─── 4. Carga de datos asíncrona ───
  async function cargarGaleria() {
    console.log("Iniciando carga de galería...");

    var contenedor = document.getElementById('galeria-container');
    if (contenedor) contenedor.innerHTML = '';

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

    var client = getSupabase();
    if (!client) {
      console.warn("[Galeria] Supabase no disponible, usando fallback");
      window._galeriaImages = FALLBACK_IMAGES.slice();
      renderizarGaleria();
      return;
    }

    try {
      console.log("Supabase disponible, procediendo con fetch...");
      var res = await client
        .from('galeria')
        .select('url_imagen, titulo')
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (res.error) throw res.error;

      if (res.data && res.data.length > 0) {
        window._galeriaImages = res.data.map(function (item) {
          return { url: item.url_imagen, titulo: item.titulo };
        });
      } else {
        console.warn('[Galeria] 0 registros con activo=true, usando fallback');
        window._galeriaImages = FALLBACK_IMAGES.slice();
      }
    } catch (err) {
      console.error('[Galeria] Error al consultar Supabase:', err);
      window._galeriaImages = FALLBACK_IMAGES.slice();
    }

    renderizarGaleria();
  }

  window.cargarGaleria = cargarGaleria;

  // ─── 5. Cambio de vista con ejecución diferida ───
  function cambiarVista(url) {
    var targetPath = new URL(url, window.location.origin).pathname;
    if (targetPath.indexOf('galeria') !== -1) {
      _galeriaEventsVinculados = false;
      setTimeout(function () {
        console.log("Navegando a galería, forzando carga...");
        cargarGaleria();
        inicializarEventosGaleria();
      }, 150);
    }
    try { if (typeof gtag === 'function') gtag('config', 'G-0M3Q8DQ3QF', { 'page_path': targetPath }); } catch (e) {}
  }

  window.cambiarVista = cambiarVista;

  // ─── Inicializar galería si estamos en esa página ───
  if (window.location.pathname.indexOf('galeria') !== -1) {
    var esperarMiSupabase = setInterval(function () {
      if (window.miSupabase) {
        clearInterval(esperarMiSupabase);
        cargarGaleria();
        inicializarEventosGaleria();
      }
    }, 100);
    setTimeout(function () { clearInterval(esperarMiSupabase); }, 8000);
  }
})();
 